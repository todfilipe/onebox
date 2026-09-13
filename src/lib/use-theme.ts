"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light");

  function toggleTheme() {
    const root = document.documentElement;
    const next: Theme = theme === "dark" ? "light" : "dark";

    root.dataset.themeSwitching = "";
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
    listeners.forEach((listener) => listener());

    window.setTimeout(() => delete root.dataset.themeSwitching, 320);
  }

  return { theme, toggleTheme } as const;
}
