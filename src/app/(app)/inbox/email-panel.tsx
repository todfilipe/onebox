"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/glass-card";
import type { getEmail } from "@/lib/emails";
import {
  archive,
  cancelSnooze,
  markAsRead,
  snooze,
  unarchive,
} from "./actions";
import { CategoryMenu } from "./category-menu";
import { senderAddress, senderName } from "./email-list";
import { formatFullDate, LocalTime } from "./local-time";
import { ReplyCard } from "./reply-card";
import { SnoozeMenu } from "./snooze-menu";

type Email = NonNullable<Awaited<ReturnType<typeof getEmail>>>;

export function EmailPanel({
  email,
  replyDraft,
  children,
}: {
  email: Email;
  replyDraft: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [archiving, startArchiving] = useTransition();
  const archived = pathname.startsWith("/arquivados");
  const snoozed = pathname.startsWith("/adiados");
  const base = archived ? "/arquivados" : snoozed ? "/adiados" : "/inbox";
  const returnLabel = snoozed ? "Voltar já à inbox" : "Repor na inbox";

  useEffect(() => {
    if (!email.read_at) {
      markAsRead(email.id);
    }
  }, [email.id, email.read_at]);

  const closeParams = new URLSearchParams(params);
  closeParams.delete("email");
  const closeQuery = closeParams.toString();
  const closeHref = closeQuery ? `${base}?${closeQuery}` : base;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable;

      if (event.key === "Escape" && !typing) {
        router.push(closeHref, { scroll: false });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, closeHref]);

  function archiveAndClose() {
    startArchiving(async () => {
      await archive(email.id);
      router.push(closeHref, { scroll: false });
    });
  }

  function unarchiveAndClose() {
    startArchiving(async () => {
      await unarchive(email.id);
      router.push(closeHref, { scroll: false });
    });
  }

  function cancelSnoozeAndClose() {
    startArchiving(async () => {
      await cancelSnooze(email.id);
      router.push(closeHref, { scroll: false });
    });
  }

  return (
    <motion.div
      key={email.id}
      initial={{ opacity: 0, scale: 0.98, x: 16 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 28 }}
    >
      <GlassCard className="overflow-hidden">
        <header className="border-b border-hairline px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold">
                {email.subject ?? "(sem assunto)"}
              </h1>
              <p className="mt-1 truncate text-sm">
                <span className="font-medium">{senderName(email.sender)}</span>
                {senderAddress(email.sender) !== senderName(email.sender) && (
                  <span className="text-muted">
                    {" "}
                    {senderAddress(email.sender)}
                  </span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={
                  archived
                    ? unarchiveAndClose
                    : snoozed
                      ? cancelSnoozeAndClose
                      : archiveAndClose
                }
                disabled={archiving}
                aria-label={
                  archived || snoozed ? returnLabel : "Arquivar o email"
                }
                title={archived || snoozed ? returnLabel : "Arquivar o email"}
                className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-hairline hover:text-foreground disabled:opacity-50"
              >
                {archived || snoozed ? <UnarchiveIcon /> : <ArchiveIcon />}
              </button>
              <SnoozeMenu
                emailId={email.id}
                onSnooze={snooze}
                closeHref={closeHref}
              />
              <Link
                href={closeHref}
                scroll={false}
                aria-label="Fechar o email"
                title="Fechar o email"
                className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-hairline hover:text-foreground"
              >
                <CloseIcon />
              </Link>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            <CategoryMenu
              emailId={email.id}
              category={email.category}
              manualCategory={email.manual_category}
              effectiveCategory={email.effective_category}
            />
            <span className="flex items-center gap-1.5 rounded-full border border-hairline px-2 py-1">
              <span className="flex size-4 items-center justify-center rounded-full bg-hairline text-[9px] font-medium">
                {email.email_accounts.email_gmail.charAt(0).toUpperCase()}
              </span>
              {email.email_accounts.email_gmail}
            </span>
            <LocalTime iso={email.received_at} format={formatFullDate} />
            {email.replied_at && (
              <span className="flex items-center gap-1 rounded-full border border-hairline px-2 py-1 text-accent">
                <CheckIcon />
                Respondido
              </span>
            )}
          </div>
        </header>

        <div className="space-y-5 p-5">
          {email.ai_summary && (
            <div className="rounded-2xl border border-hairline bg-hairline/40 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-accent uppercase">
                <SparkIcon />
                Resumo da IA
              </p>
              <p className="mt-2 text-sm leading-relaxed">{email.ai_summary}</p>
            </div>
          )}

          {children}

          <ReplyCard key={email.id} emailId={email.id} draft={replyDraft} />
        </div>
      </GlassCard>
    </motion.div>
  );
}

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function ArchiveIcon() {
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
      <rect x="3" y="4" width="18" height="4" rx="1.5" />
      <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4" />
    </svg>
  );
}

function UnarchiveIcon() {
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
      <rect x="3" y="4" width="18" height="4" rx="1.5" />
      <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M12 17v-6m-2.5 2.5L12 11l2.5 2.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className="size-5"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}
