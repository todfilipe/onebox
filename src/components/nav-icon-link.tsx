"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`flex size-9 items-center justify-center rounded-full transition-colors hover:bg-hairline hover:text-foreground ${
        active ? "bg-hairline text-accent" : "text-muted"
      }`}
    >
      {children}
    </Link>
  );
}
