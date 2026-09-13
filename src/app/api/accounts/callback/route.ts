import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { registerGmailWatch } from "@/lib/gmail-watch";
import { upsertEmailAccount } from "@/lib/email-accounts";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("gmail_connect_state")?.value;
  cookieStore.delete("gmail_connect_state");

  if (!code || !expectedState || params.get("state") !== expectedState) {
    redirect("/definicoes");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/accounts/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Troca do código OAuth falhou: ${tokenRes.status}`);
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    id_token: string;
  };

  // O id_token chega diretamente da Google por TLS, por isso o payload é fiável sem verificar a assinatura.
  const payload = JSON.parse(
    Buffer.from(tokens.id_token.split(".")[1]!, "base64url").toString(),
  ) as { email: string };

  const accountId = await upsertEmailAccount({
    userId: session.user.id,
    gmailEmail: payload.email,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  });

  await registerGmailWatch(accountId);

  redirect("/definicoes");
}
