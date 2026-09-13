create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  created_at timestamptz not null default now()
);

create table public.email_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  email_gmail text not null,
  access_token text,
  refresh_token text,
  watch_expiration timestamptz,
  -- conta desligada: tokens a null e disconnected_at preenchido; a linha fica para o histórico
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, email_gmail)
);

-- RLS ativo sem políticas: só a service role (que ignora RLS) acede por agora.
alter table public.users enable row level security;
alter table public.email_accounts enable row level security;
