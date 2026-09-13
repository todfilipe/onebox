import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  },
);

const SEED_EMAIL = "seed@onebox.local";

const hoursAgo = (h) => new Date(Date.now() - h * 3600_000).toISOString();
const hoursFromNow = (h) => new Date(Date.now() + h * 3600_000).toISOString();

// Apagar o utilizador de seed remove em cascata contas, emails e regras
const { error: deleteError } = await supabase
  .from("users")
  .delete()
  .eq("email", SEED_EMAIL);
if (deleteError) throw new Error(deleteError.message);

const { data: user, error: userError } = await supabase
  .from("users")
  .insert({ email: SEED_EMAIL, name: "Utilizador de Teste" })
  .select("id")
  .single();
if (userError) throw new Error(userError.message);

const { data: accounts, error: accountsError } = await supabase
  .from("email_accounts")
  .insert([
    { user_id: user.id, email_gmail: "pessoal.teste@gmail.com" },
    { user_id: user.id, email_gmail: "trabalho.teste@gmail.com" },
  ])
  .select("id, email_gmail");
if (accountsError) throw new Error(accountsError.message);

const personal = accounts.find((a) => a.email_gmail.startsWith("pessoal")).id;
const work = accounts.find((a) => a.email_gmail.startsWith("trabalho")).id;

const emails = [
  {
    account_id: work,
    gmail_message_id: "seed-msg-001",
    sender: "Marta Correia <marta.correia@empresa.pt>",
    subject: "Reunião de amanhã antecipada para as 9h30",
    ai_summary:
      "A Marta antecipou a reunião de equipa de amanhã das 11h para as 9h30 por causa da visita do cliente. Pede confirmação de presença.",
    ai_suggested_reply:
      "Olá Marta, obrigado pelo aviso. Confirmo a minha presença às 9h30. Até amanhã!",
    category: "alta",
    state: "ativo",
    received_at: hoursAgo(2),
  },
  {
    account_id: work,
    gmail_message_id: "seed-msg-002",
    sender: "Faturação Cloudify <billing@cloudify.io>",
    subject: "A sua fatura de julho está disponível",
    ai_summary:
      "Fatura mensal do serviço Cloudify no valor de 24,90 €, com débito automático agendado para dia 30.",
    ai_suggested_reply: null,
    category: "media",
    state: "ativo",
    received_at: hoursAgo(6),
  },
  {
    account_id: work,
    gmail_message_id: "seed-msg-003",
    sender: "Rui Tavares <rui.tavares@empresa.pt>",
    subject: "Feedback ao relatório trimestral",
    ai_summary:
      "O Rui reviu o relatório e sugere reforçar a secção de resultados antes de seguir para a direção. Prazo: sexta-feira.",
    ai_suggested_reply:
      "Olá Rui, obrigado pela revisão. Incorporo as sugestões na secção de resultados e devolvo-te a versão final até quinta ao fim do dia.",
    category: "alta",
    state: "adiado",
    snoozed_until: hoursFromNow(24),
    received_at: hoursAgo(26),
  },
  {
    account_id: work,
    gmail_message_id: "seed-msg-004",
    sender: "LinkedIn <notifications@linkedin.com>",
    subject: "Tem 4 novas visualizações do seu perfil",
    ai_summary:
      "Notificação automática do LinkedIn sobre visualizações de perfil.",
    ai_suggested_reply: null,
    category: "baixa",
    state: "arquivado",
    received_at: hoursAgo(30),
  },
  {
    account_id: work,
    gmail_message_id: "seed-msg-005",
    sender: "Helpdesk <suporte@empresa.pt>",
    subject: "Ticket #4812 resolvido: acesso à VPN reposto",
    ai_summary:
      "O suporte confirma que o acesso à VPN foi reposto e o ticket fechado. Não é precisa nenhuma ação.",
    ai_suggested_reply: null,
    category: "media",
    manual_category: "baixa",
    state: "ativo",
    received_at: hoursAgo(50),
  },
  {
    account_id: personal,
    gmail_message_id: "seed-msg-006",
    sender: "Clínica São Lucas <geral@clinicasaolucas.pt>",
    subject: "Lembrete: consulta marcada para dia 30 às 15h00",
    ai_summary:
      "Lembrete da consulta de dia 30 às 15h. Pedem chegada 10 minutos antes e cartão de utente.",
    ai_suggested_reply:
      "Boa tarde, confirmo a minha presença na consulta. Obrigado.",
    category: "alta",
    state: "ativo",
    received_at: hoursAgo(4),
  },
  {
    account_id: personal,
    gmail_message_id: "seed-msg-007",
    sender: "EDP Comercial <clientes@edp.pt>",
    subject: "Fatura de eletricidade: 43,17 €",
    ai_summary:
      "Fatura mensal de eletricidade no valor de 43,17 €, com pagamento até dia 8 do próximo mês.",
    ai_suggested_reply: null,
    category: "media",
    state: "ativo",
    received_at: hoursAgo(20),
  },
  {
    account_id: personal,
    gmail_message_id: "seed-msg-008",
    sender: "Booking.com <noreply@booking.com>",
    subject: "Ofertas de última hora para o fim de semana",
    ai_summary:
      "Newsletter promocional com sugestões de estadias para o fim de semana.",
    ai_suggested_reply: null,
    category: "baixa",
    state: "ativo",
    received_at: hoursAgo(28),
  },
  {
    account_id: personal,
    gmail_message_id: "seed-msg-009",
    sender: "Ana Figueiredo <ana.figueiredo@gmail.com>",
    subject: "Fotos do jantar de sábado",
    ai_summary:
      "A Ana partilhou o álbum de fotos do jantar de sábado e pergunta se o próximo encontro fica combinado para agosto.",
    ai_suggested_reply:
      "Olá Ana! Obrigado pelas fotos, ficaram ótimas. Por mim agosto está perfeito, diz só que fim de semana dá mais jeito.",
    category: "media",
    state: "ativo",
    received_at: hoursAgo(70),
  },
  {
    account_id: personal,
    gmail_message_id: "seed-msg-010",
    sender: "Spotify <no-reply@spotify.com>",
    subject: "O seu resumo semanal já chegou",
    ai_summary: "Notificação automática com o resumo semanal de audição.",
    ai_suggested_reply: null,
    category: "baixa",
    state: "arquivado",
    received_at: hoursAgo(90),
  },
  {
    account_id: personal,
    gmail_message_id: "seed-msg-011",
    sender: "Junta de Freguesia <geral@jf-centro.pt>",
    subject: "Resposta ao seu pedido de atestado de residência",
    ai_summary: null,
    ai_suggested_reply: null,
    category: null,
    state: "ativo",
    received_at: hoursAgo(1),
  },
];

const { error: emailsError } = await supabase.from("emails").insert(emails);
if (emailsError) throw new Error(emailsError.message);

const { error: rulesError } = await supabase.from("category_rules").insert([
  {
    user_id: user.id,
    condition_type: "remetente",
    condition_value: "marta.correia@empresa.pt",
    forced_category: "alta",
    enabled: true,
  },
  {
    user_id: user.id,
    condition_type: "dominio",
    condition_value: "booking.com",
    forced_category: "baixa",
    enabled: true,
  },
  {
    user_id: user.id,
    condition_type: "palavra_chave",
    condition_value: "fatura",
    forced_category: "media",
    enabled: false,
  },
]);
if (rulesError) throw new Error(rulesError.message);

console.log(
  `Seed criado: 1 utilizador (${SEED_EMAIL}), 2 contas, ${emails.length} emails, 3 regras.`,
);
