import { describe, expect, it } from "vitest";
import {
  buildRewritePrompt,
  extractGeminiText,
  parseTone,
  tones,
} from "./gemini";

describe("validação do ajuste de tom", () => {
  it("aceita os quatro ajustes previstos e rejeita o resto", () => {
    for (const tone of tones) {
      expect(parseTone(tone)).toBe(tone);
    }
    expect(parseTone("Mais agressiva")).toBeUndefined();
    expect(parseTone("")).toBeUndefined();
  });
});

describe("prompt de reescrita", () => {
  it("inclui uma instrução distinta por ajuste e o texto original", () => {
    const text = "Obrigado pelo envio, confirmo a receção dos documentos.";
    const prompts = tones.map((tone) => buildRewritePrompt(tone, text));

    for (const prompt of prompts) {
      expect(prompt).toContain(text);
      expect(prompt).toContain("portugues de Portugal");
      expect(prompt).toContain("apenas o texto reescrito");
    }
    expect(new Set(prompts).size).toBe(tones.length);
  });
});

describe("leitura da resposta da Gemini", () => {
  it("extrai e limpa o texto do primeiro candidato", () => {
    const payload = {
      candidates: [
        { content: { parts: [{ text: "  Texto reescrito.\n" }] } },
        { content: { parts: [{ text: "Alternativa ignorada." }] } },
      ],
    };
    expect(extractGeminiText(payload)).toBe("Texto reescrito.");
  });

  it("devolve undefined quando a resposta vem vazia ou malformada", () => {
    expect(extractGeminiText({})).toBeUndefined();
    expect(extractGeminiText({ candidates: [] })).toBeUndefined();
    expect(
      extractGeminiText({ candidates: [{ content: { parts: [] } }] }),
    ).toBeUndefined();
    expect(
      extractGeminiText({
        candidates: [{ content: { parts: [{ text: " " }] } }],
      }),
    ).toBeUndefined();
  });
});
