import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

let target = ["--local"];

if (process.argv.includes("--prod")) {
  process.loadEnvFile(".env.local");
  const { SUPABASE_ACCESS_TOKEN, SUPABASE_URL } = process.env;
  if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_URL) {
    console.error("Faltam SUPABASE_ACCESS_TOKEN ou SUPABASE_URL no .env.local");
    process.exit(1);
  }
  target = ["--project-id", new URL(SUPABASE_URL).hostname.split(".")[0]];
}

const result = spawnSync(
  "npx",
  ["supabase", "gen", "types", "typescript", ...target, "--schema", "public"],
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
console.log(`Tipos gerados em src/types/database.ts (${target.join(" ")})`);
