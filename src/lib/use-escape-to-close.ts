"use client";

import { useEffect } from "react";

// Em capture para o Escape fechar só a camada de cima (menu, overlay) e não chegar ao painel por baixo.
export function useEscapeToClose(active: boolean, close: () => void) {
  useEffect(() => {
    if (!active) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [active, close]);
}
