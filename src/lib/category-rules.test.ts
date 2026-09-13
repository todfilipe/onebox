import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRule,
  deleteRule,
  getRules,
  setRuleEnabled,
  updateRule,
  type CategoryRule,
} from "./category-rules";

const db = vi.hoisted(() => ({
  selectResult: {
    data: [] as unknown[],
    error: null as { message: string } | null,
  },
  mutationResult: { error: null as { message: string } | null },
  lastInsert: null as Record<string, unknown> | null,
  lastUpdate: null as Record<string, unknown> | null,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: () => {
        const chain = {
          eq: () => chain,
          order: async () => db.selectResult,
        };
        return chain;
      },
      insert: (payload: Record<string, unknown>) => {
        db.lastInsert = payload;
        return Promise.resolve(db.mutationResult);
      },
      update: (payload: Record<string, unknown>) => {
        db.lastUpdate = payload;
        const chain = {
          eq: () => chain,
          then: (resolve: (value: typeof db.mutationResult) => void) =>
            resolve(db.mutationResult),
        };
        return chain;
      },
      delete: () => {
        const chain = {
          eq: () => chain,
          then: (resolve: (value: typeof db.mutationResult) => void) =>
            resolve(db.mutationResult),
        };
        return chain;
      },
    }),
  }),
}));

function rule(overrides: Partial<CategoryRule>): CategoryRule {
  return {
    id: crypto.randomUUID(),
    user_id: "utilizador",
    condition_type: "remetente",
    condition_value: "alguem@exemplo.pt",
    forced_category: "alta",
    enabled: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("CRUD das regras de categorização", () => {
  beforeEach(() => {
    db.selectResult = { data: [], error: null };
    db.mutationResult = { error: null };
    db.lastInsert = null;
    db.lastUpdate = null;
  });

  it("lê todas as regras do utilizador", async () => {
    const rows = [rule({})];
    db.selectResult = { data: rows, error: null };

    await expect(getRules("utilizador")).resolves.toBe(rows);
  });

  it("falha a leitura com uma mensagem em português", async () => {
    db.selectResult = { data: [], error: { message: "erro de rede" } };

    await expect(getRules("utilizador")).rejects.toThrow(
      "Falha ao ler as regras de categorização",
    );
  });

  it("cria uma regra associada ao utilizador", async () => {
    await createRule("utilizador", {
      conditionType: "dominio",
      conditionValue: "empresa.pt",
      forcedCategory: "media",
    });

    expect(db.lastInsert).toMatchObject({
      user_id: "utilizador",
      condition_type: "dominio",
      condition_value: "empresa.pt",
      forced_category: "media",
    });
  });

  it("falha a criação com uma mensagem em português", async () => {
    db.mutationResult = { error: { message: "duplicado" } };

    await expect(
      createRule("utilizador", {
        conditionType: "remetente",
        conditionValue: "a@b.pt",
        forcedCategory: "alta",
      }),
    ).rejects.toThrow("Falha ao criar a regra");
  });

  it("atualiza os campos de uma regra existente", async () => {
    await updateRule("utilizador", "regra-1", {
      conditionType: "palavra_chave",
      conditionValue: "urgente",
      forcedCategory: "alta",
    });

    expect(db.lastUpdate).toMatchObject({
      condition_type: "palavra_chave",
      condition_value: "urgente",
      forced_category: "alta",
    });
  });

  it("ativa e desativa uma regra sem tocar nas restantes colunas", async () => {
    await setRuleEnabled("utilizador", "regra-1", false);

    expect(db.lastUpdate).toEqual({ enabled: false });
  });

  it("remove uma regra", async () => {
    await expect(deleteRule("utilizador", "regra-1")).resolves.toBeUndefined();
  });

  it("falha a remover com uma mensagem em português", async () => {
    db.mutationResult = { error: { message: "não encontrado" } };

    await expect(deleteRule("utilizador", "regra-1")).rejects.toThrow(
      "Falha ao remover a regra",
    );
  });
});
