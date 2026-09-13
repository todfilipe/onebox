import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // O guard do server-only rebenta fora do React; nos testes em Node não guarda nada.
      "server-only": fileURLToPath(
        new URL("./vitest.server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          exclude: [...configDefaults.exclude, "**/*.integration.test.ts"],
          env: {
            SUPABASE_URL: "http://127.0.0.1:54321",
            SUPABASE_SERVICE_ROLE_KEY: "service-role-de-teste",
            SUPABASE_JWT_SECRET:
              "segredo-jwt-de-teste-com-mais-de-32-caracteres",
          },
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["src/**/*.integration.test.ts"],
          setupFiles: ["./vitest.integration.setup.ts"],
          fileParallelism: false,
        },
      },
    ],
  },
});
