"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { IconButton } from "@/components/icon-button";
import { AccountSelector } from "./account-selector";

type Account = { id: string; email_gmail: string };

const options = [
  { value: "", label: "Todos" },
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

export function FilterBar({ accounts }: { accounts: Account[] }) {
  const params = useSearchParams();
  const active = params.get("importancia") ?? "";
  const activeAccount = params.get("conta") ?? "";
  const filtering = active !== "" || activeAccount !== "";
  const [open, setOpen] = useState(filtering);

  function hrefFor(value: string) {
    const next = new URLSearchParams(params);

    if (value) {
      next.set("importancia", value);
    } else {
      next.delete("importancia");
    }

    const query = next.toString();
    return query ? `/inbox?${query}` : "/inbox";
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="contas"
            initial={{ opacity: 0, x: -12, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -12, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
          >
            <AccountSelector accounts={accounts} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ml-auto flex items-center gap-1">
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="importancia"
              initial={{ opacity: 0, x: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 12, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              className="flex flex-wrap items-center gap-2"
            >
              {options.map((option) => {
                const selected = option.value === active;

                return (
                  <Link
                    key={option.value}
                    href={hrefFor(option.value)}
                    scroll={false}
                    aria-current={selected || undefined}
                    className={`relative rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-300 ${
                      selected
                        ? "border-accent text-white"
                        : "border-hairline text-muted hover:text-foreground"
                    }`}
                  >
                    {selected && (
                      <motion.span
                        layoutId="filtro-importancia"
                        transition={{
                          type: "spring",
                          stiffness: 220,
                          damping: 28,
                        }}
                        className="absolute inset-0 rounded-full bg-accent"
                      />
                    )}
                    <span className="relative">{option.label}</span>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <span className="relative">
          <IconButton
            label={open ? "Esconder filtros" : "Filtrar a inbox"}
            expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <FunnelIcon />
          </IconButton>
          {!open && filtering && (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-accent" />
          )}
        </span>
      </div>
    </div>
  );
}

function FunnelIcon() {
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
      <path d="M4 5h16l-6.2 7.2v5.3L10.2 19v-6.8z" />
    </svg>
  );
}
