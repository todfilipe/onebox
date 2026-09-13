import { spawnSync } from "node:child_process";

let args = ["supabase", "migration", "up", "--local"];

if (process.argv.includes("--prod")) {
  process.loadEnvFile(".env.local");
  if (!process.env.SUPABASE_DB_URL) {
    console.error("Falta SUPABASE_DB_URL no .env.local");
    process.exit(1);
  }
  args = ["supabase", "db", "push", "--db-url", process.env.SUPABASE_DB_URL];
}

const result = spawnSync("npx", args, {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
