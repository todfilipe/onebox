import { randomBytes } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { registerGmailWatch } from "./gmail-watch";
import { decryptToken, encryptToken } from "./token-crypto";

const db = vi.hoisted(() => ({
  selectResult: null as unknown,
  updates: [] as Record<string, unknown>[],
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: () => {
        const chain = {
          eq: () => chain,
          single: async () => db.selectResult,
        };
        return chain;
      },
      update: (payload: Record<string, unknown>) => {
        db.updates.push(payload);
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

const watchOk = () =>
  Response.json({ historyId: "987654", expiration: "1785000000000" });

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  process.env.GMAIL_PUBSUB_TOPIC =
    "projects/onebox-test/topics/gmail-notifications";
});

beforeEach(() => {
  fetchMock.mockReset();
  db.updates = [];
  db.selectResult = {
    data: {
      access_token: encryptToken("ya29.access-token"),
      refresh_token: encryptToken("1//refresh-token"),
      last_history_id: null,
    },
    error: null,
  };
});

describe("registo do watch da Gmail API", () => {
  it("subscreve a INBOX no tópico configurado e guarda a expiração e o historyId", async () => {
    fetchMock.mockResolvedValue(watchOk());

    await registerGmailWatch("account-1");

    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://gmail.googleapis.com/gmail/v1/users/me/watch");
    expect(options.headers.Authorization).toBe("Bearer ya29.access-token");
    expect(JSON.parse(options.body)).toEqual({
      topicName: "projects/onebox-test/topics/gmail-notifications",
      labelIds: ["INBOX"],
    });
    expect(db.updates).toEqual([
      {
        last_history_id: "987654",
        watch_expiration: new Date(1785000000000).toISOString(),
      },
    ]);
  });

  it("mantém o historyId já guardado ao voltar a subscrever", async () => {
    db.selectResult = {
      data: {
        access_token: encryptToken("ya29.access-token"),
        refresh_token: encryptToken("1//refresh-token"),
        last_history_id: "111222",
      },
      error: null,
    };
    fetchMock.mockResolvedValue(watchOk());

    await registerGmailWatch("account-1");

    expect(db.updates[0]).toMatchObject({ last_history_id: "111222" });
  });

  it("renova o access token expirado e repete a subscrição", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ access_token: "ya29.novo" }))
      .mockResolvedValueOnce(watchOk());

    await registerGmailWatch("account-1");

    const [refreshUrl, refreshOptions] = fetchMock.mock.calls[1]!;
    expect(refreshUrl).toBe("https://oauth2.googleapis.com/token");
    expect(String(refreshOptions.body)).toContain(
      `refresh_token=${encodeURIComponent("1//refresh-token")}`,
    );
    expect(fetchMock.mock.calls[2]![1].headers.Authorization).toBe(
      "Bearer ya29.novo",
    );
    expect(decryptToken(db.updates[0]!.access_token as string)).toBe(
      "ya29.novo",
    );
    expect(db.updates[1]).toMatchObject({ last_history_id: "987654" });
  });

  it("não rebenta o fluxo de ligação quando a Gmail API falha", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(registerGmailWatch("account-1")).resolves.toBeUndefined();

    expect(db.updates).toEqual([]);
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });

  it("não chama a Gmail API se a conta já não tiver tokens", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    db.selectResult = {
      data: { access_token: null, refresh_token: null },
      error: null,
    };

    await registerGmailWatch("account-1");

    expect(fetchMock).not.toHaveBeenCalled();
    logged.mockRestore();
  });
});
