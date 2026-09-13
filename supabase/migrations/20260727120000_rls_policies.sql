-- Não há Supabase Auth: a app emite JWTs com sub = public.users.id, e é isso que auth.uid() devolve.

create policy users_select_own on public.users
  for select to authenticated
  using (id = (select auth.uid()));

create policy email_accounts_select_own on public.email_accounts
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Os tokens OAuth, mesmo encriptados, nunca chegam ao browser.
revoke select on table public.email_accounts from anon, authenticated;
grant select (id, user_id, email_gmail, watch_expiration, disconnected_at, created_at)
  on public.email_accounts to authenticated;

create policy emails_select_own on public.emails
  for select to authenticated
  using (
    exists (
      select 1
      from public.email_accounts a
      where a.id = emails.account_id
        and a.user_id = (select auth.uid())
    )
  );

create policy emails_update_own on public.emails
  for update to authenticated
  using (
    exists (
      select 1
      from public.email_accounts a
      where a.id = emails.account_id
        and a.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.email_accounts a
      where a.id = emails.account_id
        and a.user_id = (select auth.uid())
    )
  );

-- Do browser só se mexe no que as ações do utilizador alteram; o resto é escrito pelo pipeline via service role.
revoke update on table public.emails from anon, authenticated;
grant update (state, manual_category, snoozed_until) on public.emails to authenticated;

create policy category_rules_select_own on public.category_rules
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy category_rules_insert_own on public.category_rules
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy category_rules_update_own on public.category_rules
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy category_rules_delete_own on public.category_rules
  for delete to authenticated
  using (user_id = (select auth.uid()));
