"use client";

import { useEffect, useState, useTransition } from "react";
import { GlassCard } from "@/components/glass-card";
import { Toggle } from "@/components/toggle";
import type { CategoryRule } from "@/lib/category-rules";
import { categoryLabels, describeRuleCondition } from "@/lib/category-labels";
import { removeRule, toggleRule } from "./actions";
import { RuleModal } from "./rule-modal";

export function RuleCard({ rule }: { rule: CategoryRule }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [enabled, setEnabled] = useState(rule.enabled);
  const [previousEnabled, setPreviousEnabled] = useState(rule.enabled);
  const [, startTransition] = useTransition();

  if (rule.enabled !== previousEnabled) {
    setPreviousEnabled(rule.enabled);
    setEnabled(rule.enabled);
  }

  useEffect(() => {
    if (!confirmingDelete) return;
    const timeout = setTimeout(() => setConfirmingDelete(false), 3000);
    return () => clearTimeout(timeout);
  }, [confirmingDelete]);

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(() => toggleRule(rule.id, next));
  }

  function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    startTransition(() => removeRule(rule.id));
  }

  return (
    <>
      <GlassCard className="flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`flex min-w-0 flex-1 items-center gap-2 text-left transition-opacity ${
            enabled ? "" : "opacity-50"
          }`}
        >
          <span className="truncate text-sm font-medium">
            {describeRuleCondition(rule)}
          </span>
          <ArrowIcon />
          <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">
            {categoryLabels[rule.forced_category]} importância
          </span>
        </button>

        <Toggle
          checked={enabled}
          onChange={handleToggle}
          label="Ativar regra"
        />

        <button
          type="button"
          onClick={handleDelete}
          aria-label="Remover regra"
          title={
            confirmingDelete ? "Clica novamente para remover" : "Remover regra"
          }
          className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-hairline ${
            confirmingDelete
              ? "text-red-500"
              : "text-muted hover:text-foreground"
          }`}
        >
          <TrashIcon />
        </button>
      </GlassCard>

      <RuleModal open={editing} onClose={() => setEditing(false)} rule={rule} />
    </>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5 shrink-0 text-muted"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 .8 12a2 2 0 0 0 2 1.9h4.4a2 2 0 0 0 2-1.9L18 7" />
    </svg>
  );
}
