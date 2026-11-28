-- Orders: service_role only. App inserts via SUPABASE_SERVICE_ROLE_KEY on the server.

grant usage on schema public to anon, authenticated, service_role;

grant all privileges on table public.orders to service_role;

alter table public.orders enable row level security;

drop policy if exists allow_anon_select_orders on public.orders;
drop policy if exists allow_anon_insert_orders on public.orders;