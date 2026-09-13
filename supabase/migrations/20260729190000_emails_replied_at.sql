-- Respondido é ortogonal ao ciclo de vida (ativo/arquivado/adiado), como o read_at.
alter table public.emails
  add column replied_at timestamptz;
