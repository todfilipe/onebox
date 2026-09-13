import { PHASE_PRODUCTION_BUILD } from "next/constants";

const requiredEnv = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_JWT_SECRET",
  "GEMINI_API_KEY",
  "TOKEN_ENCRYPTION_KEY",
  "GMAIL_PUBSUB_TOPIC",
];

export function missingEnv(env: Record<string, string | undefined>) {
  return requiredEnv.filter((name) => !env[name]?.trim());
}

export function register() {
  // O next build também chama o register, e aí só existem os valores de mentira do Dockerfile.
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return;

  const missing = missingEnv(process.env);
  if (missing.length > 0) {
    throw new Error(
      `Faltam variáveis de ambiente: ${missing.join(", ")}. Vê o .env.example.`,
    );
  }
}
