-- Phase 1 schema (polish RLS in Phase 2)

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text,
  phone_e164 text,
  phone_country text,
  email text not null,
  city text,
  payment_method text,
  order_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  quiz_answers jsonb,
  created_at timestamptz not null default now()
);

alter table public.enrollments enable row level security;
alter table public.contact_leads enable row level security;