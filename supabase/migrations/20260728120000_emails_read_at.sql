-- Null = por ler. Preenchido quando o utilizador abre o email no painel.
alter table public.emails
  add column read_at timestamptz;

grant update (read_at) on table public.emails to authenticated;
