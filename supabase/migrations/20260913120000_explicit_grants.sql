-- Projetos Supabase recentes já não dão SELECT/INSERT/UPDATE/DELETE por defeito às tabelas novas do schema public.

grant select, insert, update, delete on all tables in schema public to service_role;

grant select on public.users, public.emails, public.category_rules to authenticated;
grant insert, update, delete on public.category_rules to authenticated;
