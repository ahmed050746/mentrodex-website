-- Bucket for /pay step-3 screenshots (public URLs in image_upload for Phase 1 simplicity)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-screenshots',
  'payment-screenshots',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Server/API uploads using publishable or anon key (tighten with service role in production)
drop policy if exists payment_screenshots_insert on storage.objects;
create policy payment_screenshots_insert
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'payment-screenshots');

drop policy if exists payment_screenshots_select on storage.objects;
create policy payment_screenshots_select
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'payment-screenshots');