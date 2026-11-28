-- Emergency: service_role grants when orders insert fails from the server API.
-- Do NOT re-open anon SELECT or INSERT — use migrations 011 and 013.

grant usage on schema public to anon, authenticated, service_role;

grant all privileges on table public.orders to service_role;

alter table public.orders enable row level security;

drop policy if exists allow_anon_select_orders on public.orders;
drop policy if exists allow_anon_insert_orders on public.orders;