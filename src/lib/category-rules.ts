import type { Database } from "@/types/database";
import type { EmailCategory } from "./emails";
import { supabaseAdmin } from "./supabase";

export type CategoryRule =
  Database["public"]["Tables"]["category_rules"]["Row"];

export function parseConditionType(value: string | undefined) {
  const types: CategoryRule["condition_type"][] = [
    "remetente",
    "dominio",
    "palavra_chave",
  ];
  return types.find((type) => type === value);
}

export async function getRules(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("category_rules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");

  if (error) {
    throw new Error(
      `Falha ao ler as regras de categorização: ${error.message}`,
    );
  }

  return data;
}

type RuleInput = {
  conditionType: CategoryRule["condition_type"];
  conditionValue: string;
  forcedCategory: EmailCategory;
};

export async function createRule(userId: string, input: RuleInput) {
  const { error } = await supabaseAdmin.from("category_rules").insert({
    user_id: userId,
    condition_type: input.conditionType,
    condition_value: input.conditionValue,
    forced_category: input.forcedCategory,
  });

  if (error) {
    throw new Error(`Falha ao criar a regra: ${error.message}`);
  }
}

export async function updateRule(
  userId: string,
  ruleId: string,
  input: RuleInput,
) {
  const { error } = await supabaseAdmin
    .from("category_rules")
    .update({
      condition_type: input.conditionType,
      condition_value: input.conditionValue,
      forced_category: input.forcedCategory,
    })
    .eq("id", ruleId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Falha ao atualizar a regra: ${error.message}`);
  }
}

export async function setRuleEnabled(
  userId: string,
  ruleId: string,
  enabled: boolean,
) {
  const { error } = await supabaseAdmin
    .from("category_rules")
    .update({ enabled })
    .eq("id", ruleId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Falha ao atualizar a regra: ${error.message}`);
  }
}

export async function deleteRule(userId: string, ruleId: string) {
  const { error } = await supabaseAdmin
    .from("category_rules")
    .delete()
    .eq("id", ruleId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Falha ao remover a regra: ${error.message}`);
  }
}
