"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GoogleIcon } from "@/components/google-icon";
import { useEscapeToClose } from "@/lib/use-escape-to-close";

export function AddAccountModal() {
  const [open, setOpen] = useState(false);

  useEscapeToClose(open, () => setOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Adicionar conta
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
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
              aria-labelledby="add-account-title"
              className="w-full max-w-sm rounded-glass border border-hairline bg-background p-8 text-center shadow-glass"
            >
              <h2 id="add-account-title" className="text-xl font-semibold">
                Adicionar conta Gmail
              </h2>
              <p className="mt-2 text-sm text-muted">
                Liga outra conta Gmail para a agregar a esta inbox. Vais
                precisar de autorizar o acesso na Google.
              </p>
              <a
                href="/api/accounts/connect"
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-lg transition-opacity hover:opacity-90"
              >
                <GoogleIcon />
                Continuar com Google
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-3 w-full rounded-full px-5 py-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Cancelar
              </button>
              <p className="mt-4 text-xs text-muted">
                Vais poder remover esta conta em qualquer momento nas definições
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
