import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { decryptToken, encryptToken } from "./token-crypto";

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("encriptação de tokens", () => {
  it("desencripta de volta o valor original", () => {
    const token = "ya29.a0AfB_exemplo-de-access-token";
    expect(decryptToken(encryptToken(token))).toBe(token);
  });

  it("produz um resultado diferente em cada encriptação do mesmo valor", () => {
    const token = "1//refresh-token-exemplo";
    expect(encryptToken(token)).not.toBe(encryptToken(token));
  });

  it("rejeita valores adulterados", () => {
    const raw = Buffer.from(encryptToken("segredo"), "base64");
    raw.writeUInt8(raw.readUInt8(raw.length - 1) ^ 0xff, raw.length - 1);
    expect(() => decryptToken(raw.toString("base64"))).toThrow();
  });

  it("rejeita valores encriptados com outra chave", () => {
    const encrypted = encryptToken("segredo");
    process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    expect(() => decryptToken(encrypted)).toThrow();
  });
});
