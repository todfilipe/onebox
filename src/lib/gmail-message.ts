import { gmailFetch } from "./gmail-api";

type MessagePart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: MessagePart[];
};

export type MessageBody = { format: "html" | "text"; content: string };

function findPart(part: MessagePart, mimeType: string): string | null {
  if (part.mimeType === mimeType && part.body?.data) {
    return Buffer.from(part.body.data, "base64url").toString("utf8");
  }

  for (const child of part.parts ?? []) {
    const found = findPart(child, mimeType);
    if (found) {
      return found;
    }
  }

  return null;
}

export function extractBody(payload: MessagePart): MessageBody | null {
  const html = findPart(payload, "text/html");
  if (html) {
    return { format: "html", content: html };
  }

  const text = findPart(payload, "text/plain");
  if (text) {
    return { format: "text", content: text };
  }

  return null;
}

export async function getMessageBody(
  accountId: string,
  gmailMessageId: string,
) {
  const response = await gmailFetch(
    accountId,
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmailMessageId}?format=full`,
  );

  if (!response.ok) {
    throw new Error(`A Gmail API recusou a mensagem: ${response.status}`);
  }

  const message = (await response.json()) as { payload?: MessagePart };

  return message.payload ? extractBody(message.payload) : null;
}
