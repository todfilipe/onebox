"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { snoozeOptions } from "@/lib/snooze";
import { useEscapeToClose } from "@/lib/use-escape-to-close";

const sizes = {
  md: { button: "size-9", icon: "size-5", menuTop: "top-11" },
  sm: { button: "size-7", icon: "size-4", menuTop: "top-9" },
};

export function SnoozeMenu({
  emailId,
  onSnooze,
  closeHref,
  size = "md",
  triggerClassName = "",
}: {
  emailId: string;
  onSnooze: (emailId: string, until: string) => Promise<void>;
  closeHref?: string;
  size?: keyof typeof sizes;
  triggerClassName?: string;
}) {
  const [options, setOptions] = useState<ReturnType<
    typeof snoozeOptions
  > | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { button, icon, menuTop } = sizes[size];

  useEscapeToClose(options !== null, () => setOptions(null));

  function pick(until: Date) {
    startTransition(async () => {
      await onSnooze(emailId, until.toISOString());
      setOptions(null);
      if (closeHref) {
        router.push(closeHref, { scroll: false });
      }
    });
  }

  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOptions(options ? null : snoozeOptions(new Date()))}
        disabled={pending}
        aria-label="Adiar o email"
        aria-haspopup="menu"
        aria-expanded={options !== null}
        title="Adiar o email"
        className={`flex ${button} items-center justify-center rounded-full text-muted transition-colors hover:bg-hairline hover:text-foreground disabled:opacity-50 ${triggerClassName}`}
      >
        <ClockIcon className={icon} />
      </button>

      <AnimatePresence>
        {options && (
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => setOptions(null)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={`absolute ${menuTop} right-0 z-20 w-60 rounded-2xl border border-hairline bg-glass p-1.5 shadow-glass backdrop-blur-2xl`}
            >
              {options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => pick(option.until)}
                  disabled={pending}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-hairline disabled:opacity-50"
                >
                  <span>{option.label}</span>
                  <span className="text-xs text-muted tabular-nums">
                    {formatUntil(option.until)}
                  </span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </span>
  );
}

function formatUntil(until: Date) {
  const weekday = until
    .toLocaleDateString("pt-PT", { weekday: "short" })
    .replace(".", "");
  const time = until.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${weekday} ${time}`;
}

function ClockIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
