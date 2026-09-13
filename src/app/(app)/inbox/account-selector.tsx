"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Account = { id: string; email_gmail: string };

export function AccountSelector({ accounts }: { accounts: Account[] }) {
  const params = useSearchParams();
  const active = params.get("conta") ?? "";

  function hrefFor(value: string) {
    const next = new URLSearchParams(params);

    if (value) {
      next.set("conta", value);
    } else {
      next.delete("conta");
    }

    const query = next.toString();
    return query ? `/inbox?${query}` : "/inbox";
  }

  if (accounts.length < 2) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={hrefFor("")}
        scroll={false}
        aria-current={active === "" || undefined}
        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-300 ${
          active === ""
            ? "border-accent bg-accent text-white"
            : "border-hairline text-muted hover:text-foreground"
        }`}
      >
        Todas as contas
      </Link>
      <div className="flex items-center -space-x-1.5">
        {accounts.map((account) => {
          const selected = account.id === active;

          return (
            <Link
              key={account.id}
              href={hrefFor(selected ? "" : account.id)}
              scroll={false}
              aria-label={account.email_gmail}
              aria-current={selected || undefined}
              title={account.email_gmail}
              className={`flex size-8 items-center justify-center rounded-full border text-xs font-medium backdrop-blur-2xl transition-all duration-300 ${
                selected
                  ? "z-10 scale-110 border-accent bg-accent text-white"
                  : "border-hairline bg-background text-muted hover:z-10 hover:text-foreground"
              }`}
            >
              {account.email_gmail.charAt(0).toUpperCase()}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
