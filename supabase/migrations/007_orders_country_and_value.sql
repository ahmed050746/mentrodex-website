-- Rename country_value → country and add order value (safe if already applied in Dashboard)

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'country_value'
  ) then
    alter table public.orders rename column country_value to country;
  end if;
end $$;

alter table public.orders
  add column if not exists value numeric not null default 4500;

comment on column public.orders.country is 'Phone/country code from pay Step 1 (e.g. PK)';
comment on column public.orders.value is 'Course order amount in currency (default 4500 PKR)';