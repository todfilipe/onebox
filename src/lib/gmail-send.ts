import { gmailFetch } from "./gmail-api";

export function replySubject(original: string) {
  return /^re:/i.test(original.trim()) ? original.trim() : `Re: ${original}`;
}

// RFC 2047: cabeçalhos só aceitam ASCII, o resto viaja como palavra codificada.
function encodeHeader(value: string) {
  return /^[\x20-\x7e]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

export function buildReplyRaw(input: {
  to: string;
  subject: string;
  inReplyTo?: string | null;
  body: string;
}) {
  const headers = [
    `To: ${input.to}`,
    `Subject: ${encodeHeader(input.subject)}`,
    ...(input.inReplyTo
      ? [`In-Reply-To: ${input.inReplyTo}`, `References: ${input.inReplyTo}`]
      : []),
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ];

  const body =
    Buffer.from(input.body, "utf8")
      .toString("base64")
      .match(/.{1,76}/g)
      ?.join("\r\n") ?? "";

  const message = `${headers.join("\r\n")}\r\n\r\n${body}`;

  return Buffer.from(message, "utf8").toString("base64url");
}

export async function sendGmailReply(
  accountId: string,
  gmailMessageId: string,
  body: string,
) {
  const metadata = await gmailFetch(
    accountId,
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmailMessageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Reply-To&metadataHeaders=Message-ID`,
  );

  if (!metadata.ok) {
    throw new Error(
      `A Gmail API recusou a mensagem original: ${metadata.status}`,
    );
  }

  const message = (await metadata.json()) as {
    threadId: string;
    payload?: { headers?: { name: string; value: string }[] };
  };

  const header = (name: string) =>
    message.payload?.headers?.find(
      (h) => h.name.toLowerCase() === name.toLowerCase(),
    )?.value;

  const to = header("Reply-To") ?? header("From");
  if (!to) {
    throw new Error("A mensagem original não tem remetente para responder");
  }

  const raw = buildReplyRaw({
    to,
    subject: replySubject(header("Subject") ?? ""),
    inReplyTo: header("Message-ID"),
    body,
  });

  const sent = await gmailFetch(
    accountId,
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw, threadId: message.threadId }),
    },
  );

  if (!sent.ok) {
    throw new Error(`A Gmail API recusou o envio: ${sent.status}`);
  }
}
