import { spawnSync } from "node:child_process";

process.loadEnvFile(".env.local");

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("Falta SUPABASE_DB_URL no .env.local");
  process.exit(1);
}

const result = spawnSync("npx", ["supabase", "db", "push", "--db-url", dbUrl], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
