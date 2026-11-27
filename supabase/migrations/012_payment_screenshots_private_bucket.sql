-- Private bucket: screenshots only via signed URLs (admin API, service role).

update storage.buckets
set public = false
where id = 'payment-screenshots';

comment on column public.orders.image_upload is
  'Object path in payment-screenshots bucket (legacy rows may store a full URL).';