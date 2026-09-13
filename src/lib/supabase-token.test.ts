import { jwtVerify } from "jose";
import { describe, expect, it } from "vitest";
import { createRealtimeToken } from "./supabase-token";

const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

describe("token de Realtime", () => {
  it("identifica o utilizador e pede o papel authenticated", async () => {
    const token = await createRealtimeToken(
      "d1a59898-6aeb-48d4-804a-ccfa39eca55b",
    );
    const { payload } = await jwtVerify(token, secret);

    expect(payload.sub).toBe("d1a59898-6aeb-48d4-804a-ccfa39eca55b");
    expect(payload.role).toBe("authenticated");
    expect(payload.aud).toBe("authenticated");
  });

  it("expira dentro de uma hora", async () => {
    const token = await createRealtimeToken("qualquer-utilizador");
    const { payload } = await jwtVerify(token, secret);

    expect(payload.exp! - payload.iat!).toBe(3600);
  });

  it("não é aceite por outro segredo", async () => {
    const token = await createRealtimeToken("qualquer-utilizador");

    await expect(
      jwtVerify(token, new TextEncoder().encode("outro-segredo-qualquer-1234")),
    ).rejects.toThrow();
  });
});
