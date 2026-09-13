"use client";

import { useSyncExternalStore } from "react";

export function formatReceivedAt(receivedAt: string) {
  const date = new Date(receivedAt);
  const isToday = date.toDateString() === new Date().toDateString();

  if (isToday) {
    return date.toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const month = date
    .toLocaleDateString("pt-PT", { month: "short" })
    .replace(".", "");

  return `${date.getDate()} ${month}`;
}

export function formatFullDate(receivedAt: string) {
  const date = new Date(receivedAt);
  const month = date
    .toLocaleDateString("pt-PT", { month: "short" })
    .replace(".", "");
  const time = date.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${date.getDate()} ${month} ${date.getFullYear()}, ${time}`;
}

export function formatSnoozedUntil(snoozedUntil: string) {
  const date = new Date(snoozedUntil);
  const now = new Date();
  const time = date.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (date.toDateString() === now.toDateString()) {
    return `Hoje às ${time}`;
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Amanhã às ${time}`;
  }

  const weekday = date
    .toLocaleDateString("pt-PT", { weekday: "short" })
    .replace(".", "");

  return `${weekday} às ${time}`;
}

// Só formata depois de montar: o fuso e o "hoje" são do leitor, e no servidor divergiam na hidratação.
export function LocalTime({
  iso,
  format,
  className,
}: {
  iso: string;
  format: (iso: string) => string;
  className?: string;
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <time dateTime={iso} className={className}>
      {mounted ? format(iso) : " "}
    </time>
  );
}
