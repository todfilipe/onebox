import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/types/database";
import { supabaseAdmin } from "./supabase";
import { createRealtimeToken } from "./supabase-token";

type Fixture = {
  userId: string;
  accountId: string;
  emailId: string;
  ruleId: string;
};

let alice: Fixture;
let bob: Fixture;

async function createFixture(name: string): Promise<Fixture> {
  const { data: user } = await supabaseAdmin
    .from("users")
    .insert({ email: `rls-${name}-${randomUUID()}@onebox.local`, name })
    .select("id")
    .single()
    .throwOnError();

  const { data: account } = await supabaseAdmin
    .from("email_accounts")
    .insert({
      user_id: user!.id,
      email_gmail: `${name}-${randomUUID()}@gmail.com`,
      access_token: "cifrado-access",
      refresh_token: "cifrado-refresh",
    })
    .select("id")
    .single()
    .throwOnError();

  const { data: email } = await supabaseAdmin
    .from("emails")
    .insert({
      account_id: account!.id,
      gmail_message_id: `rls-${name}`,
      sender: `${name} <${name}@exemplo.pt>`,
      subject: `Email da ${name}`,
      ai_summary: `Resumo da ${name}`,
      category: "media",
      state: "ativo",
      received_at: new Date().toISOString(),
    })
    .select("id")
    .single()
    .throwOnError();

  const { data: rule } = await supabaseAdmin
    .from("category_rules")
    .insert({
      user_id: user!.id,
      condition_type: "dominio",
      condition_value: `${name}.pt`,
      forced_category: "alta",
      enabled: true,
    })
    .select("id")
    .single()
    .throwOnError();

  return {
    userId: user!.id,
    accountId: account!.id,
    emailId: email!.id,
    ruleId: rule!.id,
  };
}

async function browserClientFor(userId: string) {
  const token = await createRealtimeToken(userId);
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );
}

beforeAll(async () => {
  alice = await createFixture("alice");
  bob = await createFixture("bob");
});

afterAll(async () => {
  await supabaseAdmin
    .from("users")
    .delete()
    .in("id", [alice.userId, bob.userId]);
});

describe("isolamento entre utilizadores no browser", () => {
  it("cada utilizador só vê a própria linha, contas, emails e regras", async () => {
    const client = await browserClientFor(alice.userId);

    const { data: users } = await client
      .from("users")
      .select("id")
      .throwOnError();
    const { data: accounts } = await client
      .from("email_accounts")
      .select("id")
      .throwOnError();
    const { data: emails } = await client
      .from("emails")
      .select("id")
      .throwOnError();
    const { data: rules } = await client
      .from("category_rules")
      .select("id")
      .throwOnError();

    expect(users!.map((u) => u.id)).toEqual([alice.userId]);
    expect(accounts!.map((a) => a.id)).toEqual([alice.accountId]);
    expect(emails!.map((e) => e.id)).toEqual([alice.emailId]);
    expect(rules!.map((r) => r.id)).toEqual([alice.ruleId]);
  });

  it("sem token não se lê nada", async () => {
    const anon = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );

    const { data: emails } = await anon.from("emails").select("id");
    const { data: rules } = await anon.from("category_rules").select("id");

    expect(emails ?? []).toEqual([]);
    expect(rules ?? []).toEqual([]);
  });

  it("um token assinado com outro segredo é recusado", async () => {
    const forgedToken = await new SignJWT({ role: "authenticated" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(alice.userId)
      .setAudience("authenticated")
      .setExpirationTime("1h")
      .sign(
        new TextEncoder().encode("outro-segredo-com-pelo-menos-32-caracteres"),
      );
    const forged = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${forgedToken}` } },
      },
    );

    const { error } = await forged.from("emails").select("id");

    expect(error).not.toBeNull();
  });
});

describe("tokens OAuth", () => {
  it("nunca chegam ao browser, nem os do próprio utilizador", async () => {
    const client = await browserClientFor(alice.userId);

    const { error } = await client
      .from("email_accounts")
      .select("access_token, refresh_token");

    expect(error?.code).toBe("42501");
  });
});

describe("alterações feitas a partir do browser", () => {
  it("o utilizador pode arquivar, adiar e reclassificar os próprios emails", async () => {
    const client = await browserClientFor(alice.userId);

    const { data } = await client
      .from("emails")
      .update({ state: "arquivado", manual_category: "baixa" })
      .eq("id", alice.emailId)
      .select("id")
      .throwOnError();

    expect(data!.map((e) => e.id)).toEqual([alice.emailId]);
  });

  it("não altera emails de outro utilizador", async () => {
    const client = await browserClientFor(alice.userId);

    const { data } = await client
      .from("emails")
      .update({ state: "arquivado" })
      .eq("id", bob.emailId)
      .select("id")
      .throwOnError();

    const { data: untouched } = await supabaseAdmin
      .from("emails")
      .select("state")
      .eq("id", bob.emailId)
      .single()
      .throwOnError();
    expect(data).toEqual([]);
    expect(untouched!.state).toBe("ativo");
  });

  it("não altera colunas que só o pipeline escreve", async () => {
    const client = await browserClientFor(alice.userId);

    const { error } = await client
      .from("emails")
      .update({ ai_summary: "resumo inventado" })
      .eq("id", alice.emailId);

    expect(error?.code).toBe("42501");
  });

  it("não cria regras em nome de outro utilizador", async () => {
    const client = await browserClientFor(alice.userId);

    const { error } = await client.from("category_rules").insert({
      user_id: bob.userId,
      condition_type: "remetente",
      condition_value: "intruso@exemplo.pt",
      forced_category: "baixa",
      enabled: true,
    });

    expect(error?.code).toBe("42501");
  });

  it("não apaga regras de outro utilizador", async () => {
    const client = await browserClientFor(alice.userId);

    await client
      .from("category_rules")
      .delete()
      .eq("id", bob.ruleId)
      .throwOnError();

    const { data } = await supabaseAdmin
      .from("category_rules")
      .select("id")
      .eq("id", bob.ruleId)
      .throwOnError();
    expect(data).toHaveLength(1);
  });
});
