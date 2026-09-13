"use client";

import { useState, useTransition } from "react";
import { AnimatePresence } from "framer-motion";
import { saveReply, sendReply } from "./actions";
import { ComposeOverlay } from "./compose-overlay";

type SendState = "idle" | "armed" | "sent" | "failed";

const sendLabels: Record<SendState, string> = {
  idle: "Enviar",
  armed: "Confirmar envio",
  sent: "Enviado",
  failed: "Enviar",
};

export function ReplyCard({
  emailId,
  draft,
}: {
  emailId: string;
  draft: string;
}) {
  const [text, setText] = useState(draft);
  const [saved, setSaved] = useState(draft);
  const [saving, startSaving] = useTransition();
  const [sending, startSending] = useTransition();
  const [sendState, setSendState] = useState<SendState>("idle");
  const [composing, setComposing] = useState(false);

  const changed = text.trim() !== saved.trim();
  const empty = text.trim() === "";

  function edit(value: string) {
    setText(value);
    if (sendState !== "idle") {
      setSendState("idle");
    }
  }

  function save() {
    startSaving(async () => {
      await saveReply(emailId, text);
      setSaved(text);
    });
  }

  function send() {
    if (sendState !== "armed") {
      setSendState("armed");
      return;
    }

    startSending(async () => {
      const { sent } = await sendReply(emailId, text);
      setSendState(sent ? "sent" : "failed");
      if (sent) {
        setSaved(text);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-hairline bg-hairline/40 px-4 py-4">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">
        Resposta sugerida
      </p>

      <textarea
        value={text}
        onChange={(event) => edit(event.target.value)}
        rows={6}
        placeholder="A IA não sugeriu resposta para este email. Podes escrever a tua."
        className="mt-3 w-full resize-y rounded-xl border border-hairline bg-background px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted focus:border-accent focus:outline-none"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!changed || saving}
          className="rounded-full border border-hairline px-4 py-1.5 text-sm font-medium transition-colors enabled:hover:border-accent enabled:hover:text-accent disabled:text-muted disabled:opacity-60"
        >
          {saving ? "A guardar" : changed ? "Guardar" : "Guardado"}
        </button>
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="rounded-full border border-hairline px-4 py-1.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          Pedir ajuste à IA
        </button>

        <div className="ml-auto flex items-center gap-2">
          {sendState === "armed" && !sending && (
            <button
              type="button"
              onClick={() => setSendState("idle")}
              className="px-2 text-sm text-muted transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={send}
            disabled={empty || sending || sendState === "sent"}
            className="rounded-full bg-accent px-5 py-1.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            {sending ? "A enviar" : sendLabels[sendState]}
          </button>
        </div>
      </div>

      {sendState === "failed" && (
        <p className="mt-2 text-right text-xs text-muted">
          Não foi possível enviar. Tenta outra vez.
        </p>
      )}

      <AnimatePresence>
        {composing && (
          <ComposeOverlay
            emailId={emailId}
            draft={text}
            onClose={() => setComposing(false)}
            onSent={(sentText) => {
              setText(sentText);
              setSaved(sentText);
              setSendState("sent");
              setComposing(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
