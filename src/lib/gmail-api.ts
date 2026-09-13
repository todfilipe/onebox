import { supabaseAdmin } from "./supabase";
import { decryptToken, encryptToken } from "./token-crypto";

async function refreshAccessToken(accountId: string, refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(`Renovação do access token falhou: ${res.status}`);
  }

  const { access_token } = (await res.json()) as { access_token: string };

  await supabaseAdmin
    .from("email_accounts")
    .update({ access_token: encryptToken(access_token) })
    .eq("id", accountId);

  return access_token;
}

export async function gmailFetch(
  accountId: string,
  url: string,
  init: RequestInit = {},
) {
  const { data: account, error } = await supabaseAdmin
    .from("email_accounts")
    .select("access_token, refresh_token")
    .eq("id", accountId)
    .single();

  if (error) {
    throw new Error(`Conta não encontrada: ${error.message}`);
  }
  if (!account.access_token || !account.refresh_token) {
    throw new Error("Conta sem tokens guardados");
  }

  const call = (accessToken: string) =>
    fetch(url, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
    });

  const response = await call(decryptToken(account.access_token));

  if (response.status !== 401) {
    return response;
  }

  return call(
    await refreshAccessToken(accountId, decryptToken(account.refresh_token)),
  );
}
