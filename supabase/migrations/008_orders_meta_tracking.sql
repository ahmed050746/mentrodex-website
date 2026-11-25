-- Attribution fields for Meta CAPI (checkout + purchase webhook)

alter table public.orders
  add column if not exists email text,
  add column if not exists fbp text,
  add column if not exists fbc text,
  add column if not exists user_agent text;

comment on column public.orders.email is 'Checkout email from /pay step 1';
comment on column public.orders.fbp is 'Facebook _fbp cookie at checkout';
comment on column public.orders.fbc is 'Facebook _fbc cookie at checkout';
comment on column public.orders.user_agent is 'navigator.userAgent at checkout submit';