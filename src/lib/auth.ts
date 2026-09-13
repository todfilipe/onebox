import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { registerGmailWatch } from "./gmail-watch";
import { upsertEmailAccount } from "./email-accounts";
import { supabaseAdmin } from "./supabase";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
].join(" ");

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Auth.js v5 procura AUTH_SECRET por defeito; o projeto usa NEXTAUTH_SECRET.
  secret: process.env.NEXTAUTH_SECRET,

  // Atrás do nginx do VPS o pedido chega por proxy; sem isto o Auth.js rejeita o host.
  trustHost: true,

  session: { strategy: "jwt" },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          // só assim a Google devolve refresh_token em todos os logins
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        const { data: user, error } = await supabaseAdmin
          .from("users")
          .upsert(
            { email: token.email!, name: token.name },
            { onConflict: "email" },
          )
          .select("id")
          .single();

        if (error) {
          throw new Error(`Falha ao guardar o utilizador: ${error.message}`);
        }

        const accountId = await upsertEmailAccount({
          userId: user.id,
          gmailEmail: token.email!,
          accessToken: account.access_token!,
          refreshToken: account.refresh_token!,
        });

        await registerGmailWatch(accountId);

        token.user_id = user.id;
      }

      return token;
    },

    session({ session, token }) {
      // Nunca copiar tokens OAuth para aqui: este objeto vai para o browser.
      if (token.user_id) {
        session.user.id = token.user_id;
      }

      return session;
    },
  },
});
