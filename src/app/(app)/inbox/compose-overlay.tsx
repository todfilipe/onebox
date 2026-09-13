"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { tones, type Tone } from "@/lib/gemini";
import { adjustTone, sendReply } from "./actions";
import { useEscapeToClose } from "@/lib/use-escape-to-close";

type SendState = "idle" | "armed" | "failed";

export function ComposeOverlay({
  emailId,
  draft,
  onClose,
  onSent,
}: {
  emailId: string;
  draft: string;
  onClose: () => void;
  onSent: (text: string) => void;
}) {
  const [text, setText] = useState(draft);
  const [adjusting, startAdjusting] = useTransition();
  const [activeTone, setActiveTone] = useState<Tone | null>(null);
  const [failed, setFailed] = useState(false);
  const [sending, startSending] = useTransition();
  const [sendState, setSendState] = useState<SendState>("idle");

  useEscapeToClose(true, onClose);

  function edit(value: string) {
    setText(value);
    if (sendState !== "idle") {
      setSendState("idle");
    }
  }

  function applyTone(tone: Tone) {
    setActiveTone(tone);
    setFailed(false);
    setSendState("idle");
    startAdjusting(async () => {
      const result = await adjustTone(text, tone);
      if (result.text) {
        setText(result.text);
      } else {
        setFailed(true);
      }
      setActiveTone(null);
    });
  }

  function send() {
    if (sendState !== "armed") {
      setSendState("armed");
      return;
    }

    startSending(async () => {
      const { sent } = await sendReply(emailId, text);
      if (sent) {
        onSent(text);
      } else {
        setSendState("failed");
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-glass border border-hairline bg-background p-6 shadow-glass"
      >
        <h2 id="compose-title" className="text-lg font-semibold">
          Editar resposta
        </h2>
        <p className="mt-1 text-sm text-muted">
          Ajusta o texto à mão ou pede um ajuste de tom à IA
        </p>

        <textarea
          value={text}
          onChange={(event) => edit(event.target.value)}
          autoFocus
          disabled={adjusting}
          placeholder="Escreve aqui a tua resposta"
          className="mt-4 min-h-64 w-full flex-1 resize-none rounded-2xl border border-hairline bg-hairline/40 px-4 py-3 text-sm leading-relaxed placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-60"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {tones.map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => applyTone(tone)}
              disabled={adjusting || text.trim() === ""}
              className="rounded-full border border-hairline bg-hairline/40 px-4 py-1.5 text-sm font-medium transition-colors enabled:hover:border-accent enabled:hover:text-accent disabled:text-muted disabled:opacity-60"
            >
              {activeTone === tone ? "A ajustar" : tone}
            </button>
          ))}
        </div>

        {failed && (
          <p className="mt-2 text-xs text-muted">
            Não foi possível ajustar o texto. Tenta outra vez.
          </p>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-hairline px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            Cancelar
          </button>
          <div className="flex items-center gap-2">
            {sendState === "failed" && !sending && (
              <p className="text-xs text-muted">
                Não foi possível enviar. Tenta outra vez.
              </p>
            )}
            <button
              type="button"
              onClick={send}
              disabled={text.trim() === "" || adjusting || sending}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            >
              {sending
                ? "A enviar"
                : sendState === "armed"
                  ? "Confirmar envio"
                  : "Enviar resposta"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
