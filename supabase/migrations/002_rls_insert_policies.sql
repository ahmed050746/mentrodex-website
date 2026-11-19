-- Allow API inserts using anon/publishable key (service role bypasses RLS)
alter table public.enrollments
  add column if not exists screenshot_provided boolean default false;

drop policy if exists allow_anon_insert_enrollments on public.enrollments;
create policy allow_anon_insert_enrollments
  on public.enrollments
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists allow_anon_insert_contact_leads on public.contact_leads;
create policy allow_anon_insert_contact_leads
  on public.contact_leads
  for insert
  to anon, authenticated
  with check (true);