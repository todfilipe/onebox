"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CategoryRule } from "@/lib/category-rules";
import { useEscapeToClose } from "@/lib/use-escape-to-close";
import {
  categoryLabels,
  conditionTypeLabels,
  conditionTypePlaceholders,
} from "@/lib/category-labels";
import { saveRule } from "./actions";

const conditionTypes = Object.keys(
  conditionTypeLabels,
) as CategoryRule["condition_type"][];
const categories = Object.keys(
  categoryLabels,
) as CategoryRule["forced_category"][];

export function RuleModal({
  open,
  onClose,
  rule,
}: {
  open: boolean;
  onClose: () => void;
  rule?: CategoryRule;
}) {
  const [conditionType, setConditionType] = useState<
    CategoryRule["condition_type"]
  >(rule?.condition_type ?? "remetente");
  const [conditionValue, setConditionValue] = useState(
    rule?.condition_value ?? "",
  );
  const [forcedCategory, setForcedCategory] = useState<
    CategoryRule["forced_category"]
  >(rule?.forced_category ?? "alta");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [wasOpen, setWasOpen] = useState(open);

  // Reabrir o modal repõe o formulário a partir da regra atual, descartando edições não guardadas.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setConditionType(rule?.condition_type ?? "remetente");
      setConditionValue(rule?.condition_value ?? "");
      setForcedCategory(rule?.forced_category ?? "alta");
      setError(null);
    }
  }

  useEscapeToClose(open, onClose);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startSaving(async () => {
      const result = await saveRule(
        rule?.id ?? null,
        conditionType,
        conditionValue,
        forcedCategory,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rule-title"
            className="w-full max-w-sm rounded-glass border border-hairline bg-background p-8 shadow-glass"
          >
            <h2 id="rule-title" className="text-xl font-semibold">
              {rule ? "Editar regra" : "Nova regra"}
            </h2>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-muted">Condição</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {conditionTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={conditionType === type}
                      onClick={() => setConditionType(type)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        conditionType === type
                          ? "border-accent bg-accent text-white"
                          : "border-hairline text-muted hover:text-foreground"
                      }`}
                    >
                      {conditionTypeLabels[type]}
                    </button>
                  ))}
                </div>
              </div>

              <input
                value={conditionValue}
                onChange={(event) => setConditionValue(event.target.value)}
                placeholder={conditionTypePlaceholders[conditionType]}
                required
                className="w-full rounded-xl border border-hairline bg-hairline/40 px-4 py-2.5 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
              />

              <div>
                <p className="text-xs font-medium text-muted">
                  Categoria forçada
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      aria-pressed={forcedCategory === category}
                      onClick={() => setForcedCategory(category)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        forcedCategory === category
                          ? "border-accent bg-accent text-white"
                          : "border-hairline text-muted hover:text-foreground"
                      }`}
                    >
                      {categoryLabels[category]} importância
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-muted">{error}</p>}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-full px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || conditionValue.trim() === ""}
                  className="flex-1 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving
                    ? "A guardar"
                    : rule
                      ? "Guardar alterações"
                      : "Criar regra"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
