"use client";

import { useState } from "react";
import { RuleModal } from "./rule-modal";

export function NewRuleButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Nova regra
      </button>
      <RuleModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
