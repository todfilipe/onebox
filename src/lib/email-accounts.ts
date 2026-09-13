import { supabaseAdmin } from "./supabase";
import { decryptToken, encryptToken } from "./token-crypto";

export async function upsertEmailAccount(input: {
  userId: string;
  gmailEmail: string;
  accessToken: string;
  refreshToken: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("email_accounts")
    .upsert(
      {
        user_id: input.userId,
        email_gmail: input.gmailEmail,
        access_token: encryptToken(input.accessToken),
        refresh_token: encryptToken(input.refreshToken),
        disconnected_at: null,
      },
      { onConflict: "user_id,email_gmail" },
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(`Falha ao guardar a conta Gmail: ${error.message}`);
  }

  return data.id;
}

export async function disconnectEmailAccount(
  userId: string,
  accountId: string,
) {
  const { data: account, error } = await supabaseAdmin
    .from("email_accounts")
    .select("refresh_token")
    .eq("id", accountId)
    .eq("user_id", userId)
    .is("disconnected_at", null)
    .single();

  if (error) {
    throw new Error(`Conta a desligar não encontrada: ${error.message}`);
  }

  // Melhor esforço: revogar o refresh_token invalida o par todo; se a Google recusar, desliga-se na mesma.
  if (account.refresh_token) {
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      body: new URLSearchParams({ token: decryptToken(account.refresh_token) }),
    }).catch(() => {});
  }

  const { error: updateError } = await supabaseAdmin
    .from("email_accounts")
    .update({
      access_token: null,
      refresh_token: null,
      disconnected_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(`Falha ao desligar a conta: ${updateError.message}`);
  }
}
