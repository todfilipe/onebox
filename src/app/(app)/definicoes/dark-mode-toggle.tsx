"use client";

import { Toggle } from "@/components/toggle";
import { useTheme } from "@/lib/use-theme";

export function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Toggle
      checked={theme === "dark"}
      onChange={toggleTheme}
      label="Modo escuro"
    />
  );
}
