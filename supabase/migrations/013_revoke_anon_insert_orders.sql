-- Orders: inserts only via service role (POST /api/enroll-stub on the server).
-- Requires SUPABASE_SERVICE_ROLE_KEY in production.

drop policy if exists allow_anon_insert_orders on public.orders;

revoke insert on table public.orders from anon, authenticated;