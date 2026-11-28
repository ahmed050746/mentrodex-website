-- Optional: run if you use /contact (skip if you only need orders).

create table if not exists public.contact_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  quiz_answers jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.contact_leads enable row level security;

grant usage on schema public to service_role;
grant all privileges on table public.contact_leads to service_role;

drop policy if exists allow_anon_insert_contact_leads on public.contact_leads;