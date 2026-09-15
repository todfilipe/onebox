"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { getInbox } from "@/lib/emails";
import type { EmailCategory, EmailState } from "@/lib/emails";
import { categoryLabels, categoryStyles } from "@/lib/category-labels";
import { GlassCard } from "@/components/glass-card";
import { formatReceivedAt, formatSnoozedUntil, LocalTime } from "./local-time";
import { SnoozeMenu } from "./snooze-menu";

type Email = Awaited<ReturnType<typeof getInbox>>[number] & {
  state?: EmailState;
  snoozed_until?: string | null;
};

type TimeField = "received_at" | "snoozed_until";

export function EmailList({
  emails,
  filtered,
  searchTerm,
  openEmailId,
  onUnarchive,
  actionLabel = "Repor na inbox",
  onArchive,
  onSnooze,
  timeField = "received_at",
  emptyState,
}: {
  emails: Email[];
  filtered: boolean;
  searchTerm?: string;
  openEmailId?: string;
  onUnarchive?: (emailId: string) => Promise<void>;
  actionLabel?: string;
  onArchive?: (emailId: string) => Promise<void>;
  onSnooze?: (emailId: string, until: string) => Promise<void>;
  timeField?: TimeField;
  emptyState?: { title: string; hint: string };
}) {
  const pathname = usePathname();
  const params = useSearchParams();

  if (emails.length === 0) {
    const { title, hint } = emptyState ?? emptyMessage(filtered, searchTerm);

    return (
      <GlassCard className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-lg font-medium">{title}</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">{hint}</p>
      </GlassCard>
    );
  }

  function hrefFor(id: string) {
    const next = new URLSearchParams(params);
    next.set("email", id);
    return `${pathname}?${next.toString()}`;
  }

  return (
    <GlassCard className="overflow-hidden">
      <ul className="divide-y divide-hairline">
        <AnimatePresence initial={false}>
          {emails.map((email) => (
            <motion.li
              key={email.id}
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <EmailRow
                email={email}
                href={hrefFor(email.id)}
                open={email.id === openEmailId}
                compact={openEmailId !== undefined}
                onUnarchive={onUnarchive}
                actionLabel={actionLabel}
                onArchive={onArchive}
                onSnooze={onSnooze}
                timeField={timeField}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </GlassCard>
  );
}

function emptyMessage(filtered: boolean, searchTerm?: string) {
  if (searchTerm) {
    return {
      title: "Sem resultados para esta pesquisa",
      hint: "Experimenta outras palavras: a pesquisa procura no assunto, no remetente e no resumo da IA.",
    };
  }

  if (filtered) {
    return {
      title: "Nenhum email neste filtro",
      hint: "Experimenta outra importância ou volta a ver todos os emails.",
    };
  }

  return {
    title: "Ainda não há emails por aqui",
    hint: "Assim que chegar um email novo a uma das contas ligadas, ele aparece nesta lista já resumido e categorizado.",
  };
}

function EmailRow({
  email,
  href,
  open,
  compact,
  onUnarchive,
  actionLabel,
  onArchive,
  onSnooze,
  timeField,
}: {
  email: Email;
  href: string;
  open: boolean;
  compact: boolean;
  onUnarchive?: (emailId: string) => Promise<void>;
  actionLabel: string;
  onArchive?: (emailId: string) => Promise<void>;
  onSnooze?: (emailId: string, until: string) => Promise<void>;
  timeField: TimeField;
}) {
  const [pending, startTransition] = useTransition();
  const timeIso =
    timeField === "snoozed_until" ? email.snoozed_until! : email.received_at;
  const timeFormat =
    timeField === "snoozed_until" ? formatSnoozedUntil : formatReceivedAt;

  function handleUnarchive(event: React.MouseEvent) {
    event.preventDefault();
    startTransition(async () => {
      await onUnarchive?.(email.id);
    });
  }

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 transition-colors sm:px-5 ${
        open ? "bg-accent/10" : "hover:bg-hairline"
      }`}
    >
      <Link
        href={href}
        scroll={false}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span
          aria-hidden="true"
          className={`size-2 shrink-0 rounded-full ${
            email.read_at ? "bg-transparent" : "bg-accent"
          }`}
        />
        {!email.read_at && <span className="sr-only">Por ler</span>}
        <AccountBadge address={email.email_accounts.email_gmail} />
        <p
          className={`truncate text-sm font-semibold ${
            compact ? "w-24" : "w-32 sm:w-44"
          }`}
        >
          {senderName(email.sender)}
        </p>
        {/* Grelha e não flex: assunto e resumo encolhem até zero sem empurrar as etiquetas para cima da hora. */}
        <div className="grid flex-1 grid-cols-[minmax(0,max-content)_auto_auto_minmax(0,1fr)] items-center">
          <p className="truncate text-sm">{email.subject ?? "(sem assunto)"}</p>
          {email.effective_category && (
            <CategoryPill category={email.effective_category} />
          )}
          {email.state && email.state !== "ativo" && (
            <span className="ml-2 rounded-full border border-hairline px-2 py-0.5 text-[11px] font-medium text-muted">
              {email.state === "arquivado" ? "Arquivado" : "Adiado"}
            </span>
          )}
          {!compact && (
            <p className="col-start-4 ml-2 hidden truncate text-sm text-muted lg:block">
              {email.ai_summary}
            </p>
          )}
        </div>
      </Link>

      {onArchive && onSnooze ? (
        <QuickActions
          emailId={email.id}
          onArchive={onArchive}
          onSnooze={onSnooze}
          timeIso={timeIso}
          timeFormat={timeFormat}
        />
      ) : onUnarchive ? (
        <span className="relative flex h-7 min-w-7 shrink-0 items-center justify-end">
          <LocalTime
            iso={timeIso}
            format={timeFormat}
            className="text-xs whitespace-nowrap text-muted tabular-nums transition-opacity group-focus-within:opacity-0 group-hover:opacity-0"
          />
          <button
            type="button"
            onClick={handleUnarchive}
            disabled={pending}
            aria-label={actionLabel}
            title={actionLabel}
            className="absolute top-0 right-0 flex size-7 items-center justify-center rounded-full text-muted opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-hairline hover:text-foreground disabled:opacity-50"
          >
            <UnarchiveIcon />
          </button>
        </span>
      ) : (
        <LocalTime
          iso={timeIso}
          format={timeFormat}
          className="shrink-0 text-xs text-muted tabular-nums"
        />
      )}
    </div>
  );
}

function QuickActions({
  emailId,
  onArchive,
  onSnooze,
  timeIso,
  timeFormat,
}: {
  emailId: string;
  onArchive: (emailId: string) => Promise<void>;
  onSnooze: (emailId: string, until: string) => Promise<void>;
  timeIso: string;
  timeFormat: (iso: string) => string;
}) {
  const [pending, startTransition] = useTransition();

  function handleArchive(event: React.MouseEvent) {
    event.preventDefault();
    startTransition(async () => {
      await onArchive(emailId);
    });
  }

  return (
    <span className="relative flex h-7 w-16 shrink-0 items-center justify-end">
      <LocalTime
        iso={timeIso}
        format={timeFormat}
        className="text-xs text-muted tabular-nums transition-opacity group-focus-within:opacity-0 group-hover:opacity-0"
      />
      <span className="absolute inset-0 flex items-center justify-end gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          onClick={handleArchive}
          disabled={pending}
          aria-label="Arquivar o email"
          title="Arquivar o email"
          className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-hairline hover:text-foreground disabled:opacity-50"
        >
          <ArchiveIcon />
        </button>
        <SnoozeMenu emailId={emailId} onSnooze={onSnooze} size="sm" />
      </span>
    </span>
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
      className="size-4"
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
      className="size-4"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="4" rx="1.5" />
      <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M12 17v-6m-2.5 2.5L12 11l2.5 2.5" />
    </svg>
  );
}

function AccountBadge({ address }: { address: string }) {
  return (
    <span
      title={address}
      className="flex size-7 shrink-0 items-center justify-center rounded-full border border-hairline text-[11px] font-medium text-muted"
    >
      <span aria-hidden="true">{address.charAt(0).toUpperCase()}</span>
      <span className="sr-only">{address}</span>
    </span>
  );
}

function CategoryPill({ category }: { category: EmailCategory }) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        key={category}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${categoryStyles[category]}`}
      >
        {categoryLabels[category]}
      </motion.span>
    </AnimatePresence>
  );
}

export function senderName(sender: string) {
  return sender.replace(/\s*<[^>]*>$/, "");
}

export function senderAddress(sender: string) {
  return sender.match(/<([^>]*)>\s*$/)?.[1] ?? sender;
}
