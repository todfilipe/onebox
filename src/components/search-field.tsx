"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 300;

export function SearchField() {
  const router = useRouter();
  const initialQuery = useSearchParams().get("q") ?? "";
  const [value, setValue] = useState(initialQuery);
  const [, startTransition] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function navigate(term: string) {
    startTransition(() => {
      router.replace(term ? `/inbox?q=${encodeURIComponent(term)}` : "/inbox");
    });
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const term = event.target.value;
    setValue(term);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => navigate(term.trim()), DEBOUNCE_MS);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    navigate(value.trim());
  }

  function clear() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setValue("");
    navigate("");
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="relative mx-auto w-full max-w-md"
    >
      <SearchIcon />
      <input
        name="q"
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Pesquisar emails"
        aria-label="Pesquisar emails"
        className="w-full rounded-full border border-hairline bg-glass py-2 pr-10 pl-10 text-sm placeholder:text-muted focus:border-accent focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Limpar a pesquisa"
          title="Limpar a pesquisa"
          className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-hairline hover:text-foreground"
        >
          <CloseIcon />
        </button>
      )}
    </form>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
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
      className="size-4"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}
