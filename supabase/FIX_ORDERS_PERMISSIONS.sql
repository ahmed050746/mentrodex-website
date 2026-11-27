-- Run in Supabase SQL Editor only when "permission denied for table orders" blocks pay/admin.
-- Does NOT re-open anon SELECT (see 011_security_harden_orders_storage.sql).

grant usage on schema public to anon, authenticated, service_role;

grant all privileges on table public.orders to service_role;
grant insert on table public.orders to anon, authenticated;

alter table public.orders enable row level security;

drop policy if exists allow_anon_select_orders on public.orders;

drop policy if exists allow_anon_insert_orders on public.orders;
create policy allow_anon_insert_orders
  on public.orders
  for insert
  to anon, authenticated
  with check (true);