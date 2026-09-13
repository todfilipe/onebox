import { randomBytes } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { encryptToken } from "./token-crypto";
import { disconnectEmailAccount } from "./email-accounts";

const db = vi.hoisted(() => ({
  selectResult: null as unknown,
  updatePayload: null as Record<string, unknown> | null,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: () => {
        const chain = {
          eq: () => chain,
          is: () => chain,
          single: async () => db.selectResult,
        };
        return chain;
      },
      update: (payload: Record<string, unknown>) => {
        db.updatePayload = payload;
        const chain = {
          eq: () => chain,
          then: (resolve: (value: { error: null }) => void) =>
            resolve({ error: null }),
        };
        return chain;
      },
    }),
  }),
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(new Response());
  db.updatePayload = null;
});

describe("desligar uma conta ligada", () => {
  it("revoga o refresh_token desencriptado e limpa a linha", async () => {
    db.selectResult = {
      data: { refresh_token: encryptToken("1//refresh-token-real") },
      error: null,
    };

    await disconnectEmailAccount("user-1", "account-1");

    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://oauth2.googleapis.com/revoke");
    expect(String(options.body)).toContain(
      `token=${encodeURIComponent("1//refresh-token-real")}`,
    );
    expect(db.updatePayload).toMatchObject({
      access_token: null,
      refresh_token: null,
    });
    expect(db.updatePayload?.disconnected_at).toBeTruthy();
  });

  it("desliga a conta na mesma quando a revogação na Google falha", async () => {
    db.selectResult = {
      data: { refresh_token: encryptToken("1//refresh-token-real") },
      error: null,
    };
    fetchMock.mockRejectedValue(new Error("rede em baixo"));

    await disconnectEmailAccount("user-1", "account-1");

    expect(db.updatePayload).toMatchObject({
      access_token: null,
      refresh_token: null,
    });
  });

  it("falha se a conta não pertencer ao utilizador ou já estiver desligada", async () => {
    db.selectResult = { data: null, error: { message: "0 rows" } };

    await expect(disconnectEmailAccount("user-1", "account-1")).rejects.toThrow(
      "Conta a desligar não encontrada",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(db.updatePayload).toBeNull();
  });
});
