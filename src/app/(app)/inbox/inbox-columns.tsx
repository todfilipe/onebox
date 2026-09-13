"use client";

import { AnimatePresence, motion } from "framer-motion";

export function InboxColumns({
  list,
  panel,
}: {
  list: React.ReactNode;
  panel: React.ReactNode | null;
}) {
  const open = panel !== null;

  return (
    <div
      className={
        open ? "flex h-[calc(100vh-11.5rem)] min-h-[26rem] gap-4" : "flex"
      }
    >
      <motion.div
        initial={false}
        animate={{ width: open ? "34%" : "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 32 }}
        className={`shrink-0 ${open ? "hidden overflow-y-auto pr-1 lg:block" : ""}`}
      >
        {list}
      </motion.div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="painel"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="min-w-0 flex-1 overflow-y-auto pr-1"
          >
            {panel}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
