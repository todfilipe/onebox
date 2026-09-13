"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { EmailCategory } from "@/lib/emails";
import { reclassify } from "./actions";
import { categoryLabels, categoryStyles } from "@/lib/category-labels";
import { useEscapeToClose } from "@/lib/use-escape-to-close";

const categories: EmailCategory[] = ["alta", "media", "baixa"];

export function CategoryMenu({
  emailId,
  category,
  manualCategory,
  effectiveCategory,
}: {
  emailId: string;
  category: EmailCategory | null;
  manualCategory: EmailCategory | null;
  effectiveCategory: EmailCategory | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEscapeToClose(open, () => setOpen(false));

  function pick(next: EmailCategory | null) {
    setOpen(false);

    if (next === effectiveCategory && next !== null) {
      return;
    }

    startTransition(async () => {
      await reclassify(emailId, next);
    });
  }

  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={pending}
        aria-label="Reclassificar a importância"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Reclassificar a importância"
        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-opacity disabled:opacity-50 ${
          effectiveCategory
            ? categoryStyles[effectiveCategory]
            : "border border-hairline text-muted"
        }`}
      >
        {effectiveCategory ? categoryLabels[effectiveCategory] : "Categoria"}
        <CaretIcon />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="absolute top-8 left-0 z-20 w-56 rounded-2xl border border-hairline bg-glass p-1.5 shadow-glass backdrop-blur-2xl"
            >
              {categories.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => pick(option)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-hairline"
                >
                  <span>{categoryLabels[option]} importância</span>
                  {option === effectiveCategory && (
                    <span className="text-xs text-accent">atual</span>
                  )}
                </button>
              ))}
              {manualCategory && (
                <button
                  type="button"
                  onClick={() => pick(null)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border-t border-hairline px-3 py-2 text-sm transition-colors hover:bg-hairline"
                >
                  <span>Voltar à sugestão da IA</span>
                  {category && (
                    <span className="text-xs text-muted">
                      {categoryLabels[category]}
                    </span>
                  )}
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </span>
  );
}

function CaretIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
