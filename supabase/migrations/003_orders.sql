-- Main order / enrollment record (column names match your spec; hyphen → country_value)

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  city text,
  country_value text,
  currency text not null default 'PKR',
  first_name text not null,
  last_name text not null,
  phone_number text,
  event_name text not null default 'enrollment',
  created_at timestamptz not null default now()
);

create index if not exists orders_order_id_idx on public.orders (order_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

alter table public.orders enable row level security;

drop policy if exists allow_anon_insert_orders on public.orders;
create policy allow_anon_insert_orders
  on public.orders
  for insert
  to anon, authenticated
  with check (true);