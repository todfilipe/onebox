import { getMessageBody } from "@/lib/gmail-message";
import { EmailFrame } from "./email-frame";

const styles = `html{overflow-y:hidden}body{margin:0;padding:20px;font:14px/1.6 -apple-system,system-ui,"Segoe UI",sans-serif;color:#17171a;background:#fff;overflow-wrap:break-word}img{max-width:100%;height:auto}a{color:#0069d9}::-webkit-scrollbar{width:11px;height:11px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{border:3px solid transparent;border-radius:999px;background-color:rgb(0 0 0 / .2);background-clip:content-box}::-webkit-scrollbar-thumb:hover{background-color:rgb(0 0 0 / .34)}`;

export async function EmailBody({
  accountId,
  gmailMessageId,
}: {
  accountId: string;
  gmailMessageId: string;
}) {
  const body = await getMessageBody(accountId, gmailMessageId).catch(
    (error) => {
      console.error(`Corpo do email ${gmailMessageId} não obtido:`, error);
      return null;
    },
  );

  if (!body) {
    return (
      <p className="text-sm text-muted">
        Não foi possível ir buscar o corpo deste email ao Gmail. O resumo acima
        continua disponível.
      </p>
    );
  }

  if (body.format === "text") {
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {body.content}
      </p>
    );
  }

  return (
    <EmailFrame
      srcDoc={`<!doctype html><meta charset="utf-8"><style>${styles}</style>${body.content}`}
    />
  );
}

export function EmailBodyPlaceholder() {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl border border-hairline p-4">
      <div className="h-3 w-4/5 rounded-full bg-hairline" />
      <div className="h-3 w-full rounded-full bg-hairline" />
      <div className="h-3 w-2/3 rounded-full bg-hairline" />
    </div>
  );
}
