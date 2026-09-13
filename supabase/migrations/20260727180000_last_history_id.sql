-- Ponto de partida do history.list seguinte: o historyId devolvido pelo watch() ou pela última notificação processada.
alter table public.email_accounts
  add column last_history_id text;
