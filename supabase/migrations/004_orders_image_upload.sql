-- Payment screenshot URL or storage path on each order

alter table public.orders
  add column if not exists image_upload text;

comment on column public.orders.image_upload is 'Public URL or storage path for payment screenshot';