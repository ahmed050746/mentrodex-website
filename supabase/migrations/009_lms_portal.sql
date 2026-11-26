-- Mentrodex Student LMS (Phase 1) — students, modules, lessons, progress
-- Access: service role only from Next.js server routes (RLS on, no public policies).

-- ---------------------------------------------------------------------------
-- students
-- ---------------------------------------------------------------------------
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone_e164 text,
  password_hash text not null,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_login_identifier_check check (
    (email is not null and btrim(email) <> '')
    or (phone_e164 is not null and btrim(phone_e164) <> '')
  )
);

comment on table public.students is 'LMS portal accounts; login via normalized email or phone_e164 + password.';
comment on column public.students.email is 'Lowercase email; optional if phone_e164 is set.';
comment on column public.students.phone_e164 is 'E.164 phone (e.g. +923001234567); optional if email is set.';
comment on column public.students.password_hash is 'Server-only bcrypt (or similar); never exposed to client.';

create unique index if not exists students_email_unique_idx
  on public.students (lower(btrim(email)))
  where email is not null and btrim(email) <> '';

create unique index if not exists students_phone_e164_unique_idx
  on public.students (phone_e164)
  where phone_e164 is not null and btrim(phone_e164) <> '';

create index if not exists students_is_active_idx
  on public.students (is_active)
  where is_active = true;

-- ---------------------------------------------------------------------------
-- course_modules (single-course curriculum sections)
-- ---------------------------------------------------------------------------
create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_modules_title_len check (char_length(btrim(title)) between 1 and 200)
);

comment on table public.course_modules is 'Ordered sections for the mentorship course library.';

create index if not exists course_modules_sort_order_idx
  on public.course_modules (sort_order asc, created_at asc);

-- ---------------------------------------------------------------------------
-- course_lessons
-- ---------------------------------------------------------------------------
create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules (id) on delete cascade,
  title text not null,
  description text,
  bunny_ref text not null,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  duration_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_lessons_title_len check (char_length(btrim(title)) between 1 and 200),
  constraint course_lessons_bunny_ref_len check (char_length(btrim(bunny_ref)) between 3 and 512)
);

comment on table public.course_lessons is 'Lessons within a module; bunny_ref matches parseBunnyRef (e.g. 786982/uuid or bunny:786982/uuid).';
comment on column public.course_lessons.bunny_ref is 'Bunny library/video ref for iframe.mediadelivery.net embed.';

create index if not exists course_lessons_module_sort_idx
  on public.course_lessons (module_id, sort_order asc, created_at asc);

-- ---------------------------------------------------------------------------
-- lesson_progress (per student, per lesson — no device/session locks)
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  last_position_seconds integer not null default 0
    constraint lesson_progress_position_nonneg check (last_position_seconds >= 0),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_progress_student_lesson_unique unique (student_id, lesson_id)
);

comment on table public.lesson_progress is 'Watch progress; students may use multiple devices concurrently.';

create index if not exists lesson_progress_student_idx
  on public.lesson_progress (student_id, updated_at desc);

create index if not exists lesson_progress_lesson_idx
  on public.lesson_progress (lesson_id);

-- ---------------------------------------------------------------------------
-- RLS — enabled, no policies (anon/authenticated denied; service_role bypasses)
-- ---------------------------------------------------------------------------
alter table public.students enable row level security;
alter table public.course_modules enable row level security;
alter table public.course_lessons enable row level security;
alter table public.lesson_progress enable row level security;

grant all privileges on table public.students to service_role;
grant all privileges on table public.course_modules to service_role;
grant all privileges on table public.course_lessons to service_role;
grant all privileges on table public.lesson_progress to service_role;