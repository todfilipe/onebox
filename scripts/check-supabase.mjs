function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

try {
  process.loadEnvFile(".env.local");
} catch {
  fail(
    "Não encontrei o ficheiro .env.local na raiz do projeto.\n" +
      "Cria-o com SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

for (const [name, value] of [
  ["SUPABASE_URL", url],
  ["SUPABASE_ANON_KEY", anonKey],
  ["SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey],
]) {
  if (!value) fail(`A variável ${name} está em falta ou vazia no .env.local.`);
}

console.log(`A testar o projeto Supabase em ${url} ...`);

const healthRes = await fetch(`${url}/auth/v1/health`, {
  headers: { apikey: anonKey },
});
if (!healthRes.ok) {
  fail(
    `O endpoint de saúde respondeu ${healthRes.status}. ` +
      "Confirma o SUPABASE_URL e a SUPABASE_ANON_KEY no dashboard (Settings · API).",
  );
}
console.log("✓ Auth acessível com a chave anon");

const restRes = await fetch(`${url}/rest/v1/`, {
  headers: {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  },
});
if (!restRes.ok) {
  fail(
    `A API REST respondeu ${restRes.status} com a service role. ` +
      "Confirma a SUPABASE_SERVICE_ROLE_KEY no dashboard (Settings · API).",
  );
}
console.log("✓ API REST acessível com a service role");

console.log("\nProjeto Supabase acessível.");
