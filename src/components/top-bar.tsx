import Image from "next/image";
import Link from "next/link";
import icon from "@/app/icon.png";
import { NavIconLink } from "./nav-icon-link";
import { SearchField } from "./search-field";
import { ThemeToggle } from "./theme-toggle";

export function TopBar({
  user,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-glass backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
        <Link href="/inbox" className="flex items-center">
          <Image src={icon} alt="OneBox" width={28} height={28} priority />
        </Link>

        <SearchField />

        <div className="flex items-center gap-2">
          <NavIconLink href="/arquivados" label="Arquivo">
            <ArchiveIcon />
          </NavIconLink>
          <NavIconLink href="/adiados" label="Adiados">
            <SnoozeIcon />
          </NavIconLink>
          <ThemeToggle />
          <Link
            href="/definicoes"
            title={user.email ?? "Definições"}
            className="ml-1 flex size-9 items-center justify-center overflow-hidden rounded-full border border-hairline bg-glass text-sm font-medium"
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "Conta"}
                width={36}
                height={36}
              />
            ) : (
              (user.name ?? user.email ?? "?").charAt(0).toUpperCase()
            )}
          </Link>
        </div>
      </div>
    </header>
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

function SnoozeIcon() {
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
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
