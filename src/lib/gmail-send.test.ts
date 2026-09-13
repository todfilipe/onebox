import { describe, expect, it } from "vitest";
import { buildReplyRaw, replySubject } from "./gmail-send";

function decodeRaw(raw: string) {
  const message = Buffer.from(raw, "base64url").toString("utf8");
  const [headerBlock, bodyBlock] = message.split("\r\n\r\n") as [
    string,
    string,
  ];
  return {
    headers: Object.fromEntries(
      headerBlock.split("\r\n").map((line) => {
        const [name, ...rest] = line.split(": ");
        return [name, rest.join(": ")];
      }),
    ),
    body: Buffer.from(bodyBlock.replace(/\r\n/g, ""), "base64").toString(
      "utf8",
    ),
  };
}

describe("assunto da resposta", () => {
  it("acrescenta o Re: quando ainda não existe", () => {
    expect(replySubject("Reunião antecipada")).toBe("Re: Reunião antecipada");
  });

  it("não duplica o Re: de uma conversa em curso", () => {
    expect(replySubject("Re: Reunião antecipada")).toBe(
      "Re: Reunião antecipada",
    );
    expect(replySubject("RE: proposta")).toBe("RE: proposta");
  });
});

describe("construção da mensagem de resposta", () => {
  it("monta os cabeçalhos e o corpo sobrevive à viagem em base64", () => {
    const { headers, body } = decodeRaw(
      buildReplyRaw({
        to: "Marta Correia <marta@empresa.pt>",
        subject: "Re: proposta",
        inReplyTo: "<abc123@mail.gmail.com>",
        body: "Confirmo a reunião às 15h. Até já!",
      }),
    );

    expect(headers["To"]).toBe("Marta Correia <marta@empresa.pt>");
    expect(headers["Subject"]).toBe("Re: proposta");
    expect(headers["In-Reply-To"]).toBe("<abc123@mail.gmail.com>");
    expect(headers["References"]).toBe("<abc123@mail.gmail.com>");
    expect(headers["Content-Type"]).toBe("text/plain; charset=UTF-8");
    expect(body).toBe("Confirmo a reunião às 15h. Até já!");
  });

  it("codifica assuntos com acentos em RFC 2047 e mantém os simples legíveis", () => {
    const accented = decodeRaw(
      buildReplyRaw({
        to: "a@b.pt",
        subject: "Re: Férias de agosto",
        body: "ok",
      }),
    );
    const plain = decodeRaw(
      buildReplyRaw({ to: "a@b.pt", subject: "Re: proposta", body: "ok" }),
    );

    expect(accented.headers["Subject"]).toBe(
      `=?UTF-8?B?${Buffer.from("Re: Férias de agosto", "utf8").toString("base64")}?=`,
    );
    expect(plain.headers["Subject"]).toBe("Re: proposta");
  });

  it("omite In-Reply-To e References quando a original não tem Message-ID", () => {
    const { headers } = decodeRaw(
      buildReplyRaw({ to: "a@b.pt", subject: "Re: x", body: "ok" }),
    );

    expect(headers["In-Reply-To"]).toBeUndefined();
    expect(headers["References"]).toBeUndefined();
  });

  it("parte o corpo longo em linhas de 76 caracteres válidas", () => {
    const longBody = "linha ".repeat(200);
    const raw = buildReplyRaw({
      to: "a@b.pt",
      subject: "Re: x",
      body: longBody,
    });
    const bodyBlock = Buffer.from(raw, "base64url")
      .toString("utf8")
      .split("\r\n\r\n")[1]!;

    expect(bodyBlock.split("\r\n").every((line) => line.length <= 76)).toBe(
      true,
    );
    expect(decodeRaw(raw).body).toBe(longBody);
  });
});
