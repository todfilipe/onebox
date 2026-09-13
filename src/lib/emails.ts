import type { Database } from "@/types/database";
import { sendGmailReply } from "./gmail-send";
import { supabaseAdmin } from "./supabase";

export type EmailCategory = Database["public"]["Enums"]["email_category"];
export type EmailState = Database["public"]["Enums"]["email_state"];

const categories: EmailCategory[] = ["alta", "media", "baixa"];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseCategory(value: string | undefined) {
  return categories.find((category) => category === value);
}

// O regresso do snooze resolve-se na leitura da inbox, sem cron nem worker.
async function wakeOverdueEmails() {
  await supabaseAdmin
    .from("emails")
    .update({ state: "ativo", snoozed_until: null })
    .eq("state", "adiado")
    .lte("snoozed_until", new Date().toISOString())
    .throwOnError();
}

export async function getInbox(
  userId: string,
  filters: { category?: EmailCategory; accountId?: string } = {},
) {
  await wakeOverdueEmails();

  let query = supabaseAdmin
    .from("emails")
    .select(
      "id, sender, subject, ai_summary, effective_category, received_at, read_at, email_accounts!inner(id, email_gmail)",
    )
    .eq("email_accounts.user_id", userId)
    .is("email_accounts.disconnected_at", null)
    .eq("state", "ativo")
    .order("received_at", { ascending: false });

  if (filters.category) {
    query = query.eq("effective_category", filters.category);
  }
  if (filters.accountId) {
    query = query.eq("account_id", filters.accountId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Falha ao ler a inbox: ${error.message}`);
  }

  return data;
}

export async function getArchived(userId: string, accountId?: string) {
  await wakeOverdueEmails();

  let query = supabaseAdmin
    .from("emails")
    .select(
      "id, sender, subject, ai_summary, effective_category, received_at, read_at, email_accounts!inner(id, email_gmail)",
    )
    .eq("email_accounts.user_id", userId)
    .is("email_accounts.disconnected_at", null)
    .eq("state", "arquivado")
    .order("received_at", { ascending: false });

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Falha ao ler os arquivados: ${error.message}`);
  }

  return data;
}

export async function getSnoozed(userId: string, accountId?: string) {
  await wakeOverdueEmails();

  let query = supabaseAdmin
    .from("emails")
    .select(
      "id, sender, subject, ai_summary, effective_category, received_at, read_at, snoozed_until, email_accounts!inner(id, email_gmail)",
    )
    .eq("email_accounts.user_id", userId)
    .is("email_accounts.disconnected_at", null)
    .eq("state", "adiado")
    .order("snoozed_until", { ascending: true });

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Falha ao ler os adiados: ${error.message}`);
  }

  return data;
}

function likePattern(term: string) {
  // O PostgREST tira uma camada de barras ao valor entre aspas, por isso o escape do LIKE leva barra a dobrar.
  const escaped = term.replace(/[\\%_]/g, "\\$&").replace(/[\\"]/g, "\\$&");

  return `"%${escaped}%"`;
}

export async function searchEmails(userId: string, term: string) {
  const text = term.trim();

  if (!text) {
    return [];
  }

  await wakeOverdueEmails();

  const pattern = likePattern(text);

  const { data, error } = await supabaseAdmin
    .from("emails")
    .select(
      "id, sender, subject, ai_summary, effective_category, received_at, read_at, state, email_accounts!inner(id, email_gmail)",
    )
    .eq("email_accounts.user_id", userId)
    .is("email_accounts.disconnected_at", null)
    .or(
      `subject.ilike.${pattern},sender.ilike.${pattern},ai_summary.ilike.${pattern}`,
    )
    .order("received_at", { ascending: false });

  if (error) {
    throw new Error(`Falha ao pesquisar emails: ${error.message}`);
  }

  return data;
}

export async function getEmail(userId: string, emailId: string) {
  if (!uuidPattern.test(emailId)) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("emails")
    .select(
      "id, account_id, gmail_message_id, sender, subject, ai_summary, ai_suggested_reply, manual_reply, category, manual_category, effective_category, received_at, read_at, replied_at, email_accounts!inner(id, email_gmail)",
    )
    .eq("id", emailId)
    .eq("email_accounts.user_id", userId)
    .is("email_accounts.disconnected_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao ler o email: ${error.message}`);
  }

  return data;
}

async function ownedAccountIds(userId: string) {
  const { data } = await supabaseAdmin
    .from("email_accounts")
    .select("id")
    .eq("user_id", userId)
    .throwOnError();

  return data.map((account) => account.id);
}

export async function markEmailAsRead(userId: string, emailId: string) {
  if (!uuidPattern.test(emailId)) {
    return;
  }

  await supabaseAdmin
    .from("emails")
    .update({ read_at: new Date().toISOString() })
    .eq("id", emailId)
    .is("read_at", null)
    .in("account_id", await ownedAccountIds(userId))
    .throwOnError();
}

export async function archiveEmail(userId: string, emailId: string) {
  if (!uuidPattern.test(emailId)) {
    return;
  }

  // Arquivar um email adiado descarta a hora de regresso, senão ela ficava agarrada ao registo.
  await supabaseAdmin
    .from("emails")
    .update({ state: "arquivado", snoozed_until: null })
    .eq("id", emailId)
    .in("account_id", await ownedAccountIds(userId))
    .throwOnError();
}

export async function unarchiveEmail(userId: string, emailId: string) {
  if (!uuidPattern.test(emailId)) {
    return;
  }

  await supabaseAdmin
    .from("emails")
    .update({ state: "ativo" })
    .eq("id", emailId)
    .in("account_id", await ownedAccountIds(userId))
    .throwOnError();
}

export async function reclassifyEmail(
  userId: string,
  emailId: string,
  category: EmailCategory | null,
) {
  if (!uuidPattern.test(emailId)) {
    return;
  }

  await supabaseAdmin
    .from("emails")
    .update({ manual_category: category })
    .eq("id", emailId)
    .in("account_id", await ownedAccountIds(userId))
    .throwOnError();
}

export async function snoozeEmail(
  userId: string,
  emailId: string,
  until: string,
) {
  if (!uuidPattern.test(emailId)) {
    return;
  }

  await supabaseAdmin
    .from("emails")
    .update({ state: "adiado", snoozed_until: until })
    .eq("id", emailId)
    .in("account_id", await ownedAccountIds(userId))
    .throwOnError();
}

export async function cancelSnoozeEmail(userId: string, emailId: string) {
  if (!uuidPattern.test(emailId)) {
    return;
  }

  await supabaseAdmin
    .from("emails")
    .update({ state: "ativo", snoozed_until: null })
    .eq("id", emailId)
    .in("account_id", await ownedAccountIds(userId))
    .throwOnError();
}

export async function sendEmailReply(
  userId: string,
  emailId: string,
  reply: string,
) {
  const email = await getEmail(userId, emailId);
  const text = reply.trim();

  if (!email || !text) {
    throw new Error("Email não encontrado ou resposta vazia");
  }

  await sendGmailReply(email.account_id, email.gmail_message_id, text);

  await supabaseAdmin
    .from("emails")
    .update({
      replied_at: new Date().toISOString(),
      // Null continua a significar "a resposta é a da IA", como no Guardar.
      manual_reply:
        text === (email.ai_suggested_reply ?? "").trim() ? null : text,
    })
    .eq("id", email.id)
    .throwOnError();
}

export function replyDraft(email: {
  ai_suggested_reply: string | null;
  manual_reply: string | null;
}) {
  return email.manual_reply ?? email.ai_suggested_reply ?? "";
}

export async function saveEmailReply(
  userId: string,
  emailId: string,
  reply: string,
) {
  if (!uuidPattern.test(emailId)) {
    return;
  }

  // Apagar o texto todo e guardar devolve a sugestão da IA, que é a única forma de a recuperar.
  await supabaseAdmin
    .from("emails")
    .update({ manual_reply: reply.trim() || null })
    .eq("id", emailId)
    .in("account_id", await ownedAccountIds(userId))
    .throwOnError();
}
