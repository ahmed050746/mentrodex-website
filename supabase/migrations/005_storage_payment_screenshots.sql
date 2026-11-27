-- Bucket for /pay step-3 screenshots (private; admin uses signed URLs).
-- Uploads: POST /api/enroll-stub with SUPABASE_SERVICE_ROLE_KEY (bypasses storage RLS).
-- No anon/authenticated storage policies — avoids public listing and arbitrary uploads.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-screenshots',
  'payment-screenshots',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists payment_screenshots_insert on storage.objects;
drop policy if exists payment_screenshots_select on storage.objects;