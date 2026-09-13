import { describe, expect, it } from "vitest";
import { extractBody } from "./gmail-message";

const encode = (value: string) => Buffer.from(value).toString("base64url");

describe("extração do corpo da mensagem do Gmail", () => {
  it("lê o corpo de uma mensagem simples de texto", () => {
    const body = extractBody({
      mimeType: "text/plain",
      body: { data: encode("Olá, confirmas a reunião de amanhã?") },
    });

    expect(body).toEqual({
      format: "text",
      content: "Olá, confirmas a reunião de amanhã?",
    });
  });

  it("prefere a versão HTML quando o email traz as duas alternativas", () => {
    const body = extractBody({
      mimeType: "multipart/alternative",
      parts: [
        { mimeType: "text/plain", body: { data: encode("versão simples") } },
        { mimeType: "text/html", body: { data: encode("<p>versão rica</p>") } },
      ],
    });

    expect(body).toEqual({ format: "html", content: "<p>versão rica</p>" });
  });

  it("encontra o corpo dentro de partes aninhadas com anexos", () => {
    const body = extractBody({
      mimeType: "multipart/mixed",
      parts: [
        {
          mimeType: "multipart/alternative",
          parts: [
            {
              mimeType: "text/plain",
              body: { data: encode("fatura em anexo") },
            },
          ],
        },
        { mimeType: "application/pdf", body: {} },
      ],
    });

    expect(body).toEqual({ format: "text", content: "fatura em anexo" });
  });

  it("descodifica base64url com os caracteres que diferem do base64 normal", () => {
    const original = "Contratação: preço ~ 12€ (já confirmado?)";

    const body = extractBody({
      mimeType: "text/plain",
      body: { data: encode(original) },
    });

    expect(body?.content).toBe(original);
  });

  it("devolve null quando não há nenhuma parte de texto legível", () => {
    const body = extractBody({
      mimeType: "multipart/mixed",
      parts: [{ mimeType: "image/png", body: { data: encode("binário") } }],
    });

    expect(body).toBeNull();
  });
});
