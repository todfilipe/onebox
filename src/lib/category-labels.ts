import type { CategoryRule } from "./category-rules";
import type { EmailCategory } from "./emails";

export const categoryLabels: Record<EmailCategory, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export const categoryStyles: Record<EmailCategory, string> = {
  alta: "bg-accent text-white",
  media: "border border-accent text-accent",
  baixa: "bg-hairline text-muted",
};

export const conditionTypeLabels: Record<
  CategoryRule["condition_type"],
  string
> = {
  remetente: "Remetente",
  dominio: "Domínio",
  palavra_chave: "Palavra-chave",
};

export const conditionTypePlaceholders: Record<
  CategoryRule["condition_type"],
  string
> = {
  remetente: "alguem@empresa.com",
  dominio: "empresa.com",
  palavra_chave: "fatura",
};

export function describeRuleCondition(
  rule: Pick<CategoryRule, "condition_type" | "condition_value">,
) {
  switch (rule.condition_type) {
    case "remetente":
      return `Remetente é ${rule.condition_value}`;
    case "dominio":
      return `Domínio é ${rule.condition_value}`;
    case "palavra_chave":
      return `Assunto contém a palavra ${rule.condition_value}`;
  }
}
