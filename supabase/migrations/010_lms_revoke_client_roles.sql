-- Harden LMS tables: no direct anon/authenticated access (service_role only via server).
revoke all on table public.students from anon, authenticated;
revoke all on table public.course_modules from anon, authenticated;
revoke all on table public.course_lessons from anon, authenticated;
revoke all on table public.lesson_progress from anon, authenticated;