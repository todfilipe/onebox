import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

process.loadEnvFile(".env.local");

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL;
if (!accessToken || !supabaseUrl) {
  console.error("Faltam SUPABASE_ACCESS_TOKEN ou SUPABASE_URL no .env.local");
  process.exit(1);
}

const projectId = new URL(supabaseUrl).hostname.split(".")[0];

const result = spawnSync(
  "npx",
  [
    "supabase",
    "gen",
    "types",
    "typescript",
    "--project-id",
    projectId,
    "--schema",
    "public",
  ],
  {
    encoding: "utf8",
    shell: process.platform === "win32",
  },
);

if (result.status !== 0) {
  console.error(result.stderr || "supabase gen types falhou");
  process.exit(1);
}

writeFileSync("src/types/database.ts", result.stdout);
console.log(`Tipos gerados em src/types/database.ts (projeto ${projectId})`);
