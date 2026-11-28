-- Contact leads: inserts only via service role (POST /api/contact-stub on the server).
-- Requires public.contact_leads — run 001_contact_leads.sql first if the table is missing.

do $$
begin
  if not exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'contact_leads'
  ) then
    raise notice 'Skipping 014: public.contact_leads does not exist.';
    return;
  end if;

  drop policy if exists allow_anon_insert_contact_leads on public.contact_leads;
  revoke insert on table public.contact_leads from anon, authenticated;
end $$;