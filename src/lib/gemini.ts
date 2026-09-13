export const tones = [
  "Mais formal",
  "Mais curta",
  "Mais simpática",
  "Mais direta",
] as const;

export type Tone = (typeof tones)[number];

const toneInstructions: Record<Tone, string> = {
  "Mais formal":
    "Torna o texto mais formal e profissional, sem o tornar frio ou distante.",
  "Mais curta":
    "Encurta o texto, mantendo apenas a informação essencial e o mesmo tom.",
  "Mais simpática":
    "Torna o texto mais caloroso e simpático, sem exagerar na familiaridade.",
  "Mais direta":
    "Torna o texto mais direto e objetivo, indo já ao assunto sem rodeios.",
};

export function parseTone(value: string) {
  return tones.find((tone) => tone === value);
}

export function buildRewritePrompt(tone: Tone, text: string) {
  return [
    "Es o assistente de escrita de uma inbox de email. Reescreve a resposta de email seguinte em portugues de Portugal, aplicando este ajuste: " +
      toneInstructions[tone],
    "Preserva o significado, os factos e a intencao do texto original. Devolve apenas o texto reescrito, sem aspas, sem comentarios e sem alternativas.",
    "Texto original:",
    text,
  ].join("\n\n");
}

export function extractGeminiText(payload: unknown) {
  const text = (
    payload as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    }
  )?.candidates?.[0]?.content?.parts?.[0]?.text;

  return text?.trim() || undefined;
}

export async function rewriteReply(tone: Tone, text: string) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
    {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: buildRewritePrompt(tone, text) }] },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini respondeu ${response.status}`);
  }

  const rewritten = extractGeminiText(await response.json());

  if (!rewritten) {
    throw new Error("Gemini devolveu uma resposta vazia");
  }

  return rewritten;
}
