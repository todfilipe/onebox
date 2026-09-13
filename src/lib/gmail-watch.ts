import { gmailFetch } from "./gmail-api";
import { supabaseAdmin } from "./supabase";

// Nunca lança: uma falha aqui não deve impedir a conta de ficar ligada, o workflow semanal volta a tentar.
export async function registerGmailWatch(accountId: string) {
  try {
    const { data: account, error } = await supabaseAdmin
      .from("email_accounts")
      .select("last_history_id")
      .eq("id", accountId)
      .single();

    if (error) {
      throw new Error(`Conta não encontrada: ${error.message}`);
    }

    const response = await gmailFetch(
      accountId,
      "https://gmail.googleapis.com/gmail/v1/users/me/watch",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicName: process.env.GMAIL_PUBSUB_TOPIC,
          labelIds: ["INBOX"],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`A Gmail API recusou o watch: ${response.status}`);
    }

    const watch = (await response.json()) as {
      historyId: string;
      expiration: string;
    };

    const { error: updateError } = await supabaseAdmin
      .from("email_accounts")
      .update({
        // Sobrescrever um historyId ainda válido saltava as mensagens que chegaram e não foram processadas.
        last_history_id: account.last_history_id ?? watch.historyId,
        watch_expiration: new Date(Number(watch.expiration)).toISOString(),
      })
      .eq("id", accountId);

    if (updateError) {
      throw new Error(`Falha ao guardar o watch: ${updateError.message}`);
    }
  } catch (error) {
    console.error(`Watch do Gmail não registado (conta ${accountId}):`, error);
  }
}
