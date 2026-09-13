-- A reclassificação manual do utilizador ganha sempre à categoria sugerida pela IA.
alter table public.emails
  add column effective_category public.email_category
  generated always as (coalesce(manual_category, category)) stored;

create index emails_effective_category_idx
  on public.emails (effective_category);
