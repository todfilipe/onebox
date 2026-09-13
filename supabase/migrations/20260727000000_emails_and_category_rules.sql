create type public.email_category as enum ('alta', 'media', 'baixa');
create type public.email_state as enum ('ativo', 'arquivado', 'adiado');
create type public.rule_condition_type as enum ('remetente', 'dominio', 'palavra_chave');

create table public.emails (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.email_accounts (id) on delete cascade,
  gmail_message_id text not null,
  sender text not null,
  subject text,
  ai_summary text,
  ai_suggested_reply text,
  category public.email_category,
  manual_category public.email_category,
  state public.email_state not null default 'ativo',
  snoozed_until timestamptz,
  received_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (account_id, gmail_message_id)
);

create index emails_account_received_idx
  on public.emails (account_id, received_at desc);

create table public.category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  condition_type public.rule_condition_type not null,
  condition_value text not null,
  forced_category public.email_category not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.emails enable row level security;
alter table public.category_rules enable row level security;
