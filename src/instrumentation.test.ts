import { describe, expect, it } from "vitest";
import { missingEnv } from "./instrumentation";

const complete = {
  GOOGLE_CLIENT_ID: "id",
  GOOGLE_CLIENT_SECRET: "secret",
  NEXTAUTH_SECRET: "secret",
  NEXTAUTH_URL: "http://localhost:3000",
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
  SUPABASE_JWT_SECRET: "jwt",
  GEMINI_API_KEY: "gemini",
  TOKEN_ENCRYPTION_KEY: "key",
  GMAIL_PUBSUB_TOPIC: "projects/p/topics/t",
};

describe("variáveis de ambiente no arranque", () => {
  it("não aponta nada quando estão todas definidas", () => {
    expect(missingEnv(complete)).toEqual([]);
  });

  it("lista as que faltam ou estão só com espaços", () => {
    expect(
      missingEnv({
        ...complete,
        GEMINI_API_KEY: undefined,
        NEXTAUTH_SECRET: "  ",
      }),
    ).toEqual(["NEXTAUTH_SECRET", "GEMINI_API_KEY"]);
  });
});
