import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { searchEmails } from "./emails";
import { supabaseAdmin } from "./supabase";

const testUserEmail = `pesquisa-${randomUUID()}@onebox.local`;
const otherUserEmail = `pesquisa-outro-${randomUUID()}@onebox.local`;

let userId: string;
let otherUserId: string;

const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 3600_000).toISOString();

const subjects = async (term: string) =>
  (await searchEmails(userId, term)).map((e) => e.subject);

beforeAll(async () => {
  const { data: users } = await supabaseAdmin
    .from("users")
    .insert([
      { email: testUserEmail, name: "Utilizador de teste" },
      { email: otherUserEmail, name: "Outro utilizador" },
    ])
    .select("id")
    .throwOnError();

  const [owner, other] = users!.map((u) => u.id) as [string, string];
  userId = owner;
  otherUserId = other;

  const { data: accounts } = await supabaseAdmin
    .from("email_accounts")
    .insert([
      { user_id: userId, email_gmail: `pessoal-${randomUUID()}@gmail.com` },
      {
        user_id: userId,
        email_gmail: `antiga-${randomUUID()}@gmail.com`,
        disconnected_at: hoursAgo(1),
      },
      { user_id: otherUserId, email_gmail: `outro-${randomUUID()}@gmail.com` },
    ])
    .select("id")
    .throwOnError();

  const [personal, old, othersAccount] = accounts!.map((a) => a.id) as [
    string,
    string,
    string,
  ];

  await supabaseAdmin
    .from("emails")
    .insert([
      {
        account_id: personal,
        gmail_message_id: "s-1",
        sender: "Billing <billing@cloudify.io>",
        subject: "Fatura de julho",
        ai_summary: "Pagamento mensal por regularizar.",
        state: "ativo",
        received_at: hoursAgo(1),
      },
      {
        account_id: personal,
        gmail_message_id: "s-2",
        sender: "MARTA CORREIA <marta.correia@empresa.pt>",
        subject: "Reunião de equipa",
        ai_summary: "Pede confirmação de presença.",
        state: "arquivado",
        received_at: hoursAgo(2),
      },
      {
        account_id: personal,
        gmail_message_id: "s-3",
        sender: "Eventos <eventos@meetup.pt>",
        subject: "Convite para sexta",
        ai_summary: "A Cloudify organiza um jantar de programadores.",
        state: "adiado",
        snoozed_until: new Date(Date.now() + 86_400_000).toISOString(),
        received_at: hoursAgo(3),
      },
      {
        account_id: personal,
        gmail_message_id: "s-4",
        sender: "Promo <promo@loja.pt>",
        subject: "Desconto 50% garantido",
        ai_summary: "Campanha de saldos.",
        state: "ativo",
        received_at: hoursAgo(4),
      },
      {
        account_id: old,
        gmail_message_id: "s-5",
        sender: "Billing <billing@cloudify.io>",
        subject: "Fatura de junho",
        ai_summary: "Pagamento já liquidado.",
        state: "ativo",
        received_at: hoursAgo(5),
      },
      {
        account_id: othersAccount,
        gmail_message_id: "s-6",
        sender: "Billing <billing@cloudify.io>",
        subject: "Fatura de maio de outra pessoa",
        ai_summary: "Pagamento de outro utilizador.",
        state: "ativo",
        received_at: hoursAgo(6),
      },
    ])
    .throwOnError();
});

afterAll(async () => {
  await supabaseAdmin.from("users").delete().in("id", [userId, otherUserId]);
});

describe("pesquisa no histórico de emails", () => {
  it("encontra pelo assunto", async () => {
    expect(await subjects("fatura de julho")).toEqual(["Fatura de julho"]);
  });

  it("encontra pelo remetente", async () => {
    expect(await subjects("meetup.pt")).toEqual(["Convite para sexta"]);
  });

  it("encontra pelo resumo da IA", async () => {
    expect(await subjects("jantar de programadores")).toEqual([
      "Convite para sexta",
    ]);
  });

  it("ignora maiúsculas e minúsculas", async () => {
    expect(await subjects("marta correia")).toEqual(["Reunião de equipa"]);
    expect(await subjects("REUNIÃO")).toEqual(["Reunião de equipa"]);
  });

  it("inclui arquivados e adiados, do mais recente para o mais antigo", async () => {
    const results = await searchEmails(userId, "cloudify");

    expect(results.map((e) => e.subject)).toEqual([
      "Fatura de julho",
      "Convite para sexta",
    ]);
    expect(results.map((e) => e.state)).toEqual(["ativo", "adiado"]);
    expect(await subjects("equipa")).toEqual(["Reunião de equipa"]);
  });

  it("não devolve emails de outro utilizador", async () => {
    expect(await subjects("fatura")).not.toContain(
      "Fatura de maio de outra pessoa",
    );
    expect(await searchEmails(randomUUID(), "fatura")).toEqual([]);
  });

  it("não devolve emails de contas desligadas", async () => {
    expect(await subjects("fatura")).toEqual(["Fatura de julho"]);
  });

  it("devolve vazio para um termo vazio ou só com espaços", async () => {
    expect(await searchEmails(userId, "")).toEqual([]);
    expect(await searchEmails(userId, "   ")).toEqual([]);
  });

  it("trata os wildcards do LIKE como texto normal", async () => {
    expect(await subjects("%")).toEqual(["Desconto 50% garantido"]);
    expect(await subjects("50%")).toEqual(["Desconto 50% garantido"]);
    expect(await subjects("Fatura_de_julho")).toEqual([]);
  });
});
