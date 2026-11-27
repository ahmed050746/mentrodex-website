-- Phase 1 security hardening (matches live Supabase fixes)
-- Orders: no anon/authenticated SELECT. Storage: no anon policies on payment-screenshots.
-- App uploads screenshots and lists orders via SUPABASE_SERVICE_ROLE_KEY on the server.

drop policy if exists allow_anon_select_orders on public.orders;

revoke select, truncate, trigger, references
  on table public.orders
  from anon, authenticated;

drop policy if exists payment_screenshots_select on storage.objects;
drop policy if exists payment_screenshots_insert on storage.objects;