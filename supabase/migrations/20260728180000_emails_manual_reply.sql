-- A resposta escrita pelo utilizador substitui a da IA sem a apagar, como manual_category faz com category.
alter table public.emails
  add column manual_reply text;
