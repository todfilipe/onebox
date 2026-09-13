"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  createRule,
  deleteRule,
  parseConditionType,
  setRuleEnabled,
  updateRule,
} from "@/lib/category-rules";
import { parseCategory } from "@/lib/emails";

export async function saveRule(
  ruleId: string | null,
  conditionType: string,
  conditionValue: string,
  forcedCategory: string,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sessão inválida" };
  }

  const type = parseConditionType(conditionType);
  const category = parseCategory(forcedCategory);
  const value = conditionValue.trim();

  if (!type || !category || !value) {
    return { error: "Preenche a condição e a categoria" };
  }

  const input = {
    conditionType: type,
    conditionValue: value,
    forcedCategory: category,
  };

  if (ruleId) {
    await updateRule(session.user.id, ruleId, input);
  } else {
    await createRule(session.user.id, input);
  }

  revalidatePath("/definicoes");
  return { error: null };
}

export async function toggleRule(ruleId: string, enabled: boolean) {
  const session = await auth();
  if (!session?.user?.id) return;

  await setRuleEnabled(session.user.id, ruleId, enabled);
  revalidatePath("/definicoes");
}

export async function removeRule(ruleId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await deleteRule(session.user.id, ruleId);
  revalidatePath("/definicoes");
}
