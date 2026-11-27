import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import type { CourseLesson, CourseModule, LessonProgress, PortalStudent } from "./types";

const STUDENT_PUBLIC_COLS =
  "id, email, phone_e164, display_name, is_active, created_at, updated_at";

function mapStudent(row: Record<string, unknown>): PortalStudent {
  return {
    id: String(row.id),
    email: row.email != null ? String(row.email) : null,
    phone_e164: row.phone_e164 != null ? String(row.phone_e164) : null,
    display_name: row.display_name != null ? String(row.display_name) : null,
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function fetchActiveStudentById(
  studentId: string,
): Promise<PortalStudent | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("students")
    .select(STUDENT_PUBLIC_COLS)
    .eq("id", studentId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[portal/db] fetchActiveStudentById", error.message);
    return null;
  }
  if (!data) return null;
  return mapStudent(data as Record<string, unknown>);
}

export async function fetchStudentAuthRow(
  identifier: { kind: "email"; email: string } | { kind: "phone"; phone_e164: string },
): Promise<{ id: string; password_hash: string; is_active: boolean } | null> {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from("students")
    .select("id, password_hash, is_active")
    .eq("is_active", true);

  if (identifier.kind === "email") {
    query = query.eq("email", identifier.email);
  } else {
    query = query.eq("phone_e164", identifier.phone_e164);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("[portal/db] fetchStudentAuthRow", error.message);
    return null;
  }
  if (!data) return null;
  return {
    id: String(data.id),
    password_hash: String(data.password_hash),
    is_active: Boolean(data.is_active),
  };
}

function mapModule(row: Record<string, unknown>): CourseModule {
  return {
    id: String(row.id),
    title: String(row.title),
    description: row.description != null ? String(row.description) : null,
    sort_order: Number(row.sort_order) || 0,
    is_published: Boolean(row.is_published),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapLesson(row: Record<string, unknown>): CourseLesson {
  const duration = row.duration_seconds;
  return {
    id: String(row.id),
    module_id: String(row.module_id),
    title: String(row.title),
    description: row.description != null ? String(row.description) : null,
    bunny_ref: String(row.bunny_ref),
    sort_order: Number(row.sort_order) || 0,
    is_published: Boolean(row.is_published),
    duration_seconds:
      duration == null ? null : Number(duration) || null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapProgress(row: Record<string, unknown>): LessonProgress {
  return {
    id: String(row.id),
    student_id: String(row.student_id),
    lesson_id: String(row.lesson_id),
    last_position_seconds: Number(row.last_position_seconds) || 0,
    completed: Boolean(row.completed),
    completed_at: row.completed_at != null ? String(row.completed_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listPublishedModulesWithLessons(): Promise<
  { module: CourseModule; lessons: CourseLesson[] }[]
> {
  const supabase = createServiceRoleClient();
  const { data: modules, error: modErr } = await supabase
    .from("course_modules")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (modErr) {
    console.error("[portal/db] listPublishedModulesWithLessons", modErr.message);
    return [];
  }

  const moduleRows = (modules ?? []) as Record<string, unknown>[];
  if (moduleRows.length === 0) return [];

  const moduleIds = moduleRows.map((m) => String(m.id));
  const { data: lessons, error: lesErr } = await supabase
    .from("course_lessons")
    .select("*")
    .in("module_id", moduleIds)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (lesErr) {
    console.error("[portal/db] course_lessons", lesErr.message);
    return moduleRows.map((row) => ({
      module: mapModule(row),
      lessons: [],
    }));
  }

  const lessonsByModule = new Map<string, CourseLesson[]>();
  for (const row of (lessons ?? []) as Record<string, unknown>[]) {
    const lesson = mapLesson(row);
    const list = lessonsByModule.get(lesson.module_id);
    if (list) list.push(lesson);
    else lessonsByModule.set(lesson.module_id, [lesson]);
  }

  return moduleRows.map((row) => {
    const courseModule = mapModule(row);
    return {
      module: courseModule,
      lessons: lessonsByModule.get(courseModule.id) ?? [],
    };
  });
}

export async function fetchLessonProgressForStudent(
  studentId: string,
): Promise<LessonProgress[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("student_id", studentId);

  if (error) {
    console.error("[portal/db] fetchLessonProgressForStudent", error.message);
    return [];
  }

  return ((data ?? []) as Record<string, unknown>[]).map(mapProgress);
}

export async function fetchPublishedLessonById(
  lessonId: string,
): Promise<CourseLesson | null> {
  const supabase = createServiceRoleClient();
  const { data: lesson, error: lesErr } = await supabase
    .from("course_lessons")
    .select("*")
    .eq("id", lessonId)
    .eq("is_published", true)
    .maybeSingle();

  if (lesErr) {
    console.error("[portal/db] fetchPublishedLessonById", lesErr.message);
    return null;
  }
  if (!lesson) return null;

  const row = lesson as Record<string, unknown>;
  const moduleId = String(row.module_id);
  const { data: mod, error: modErr } = await supabase
    .from("course_modules")
    .select("id")
    .eq("id", moduleId)
    .eq("is_published", true)
    .maybeSingle();

  if (modErr) {
    console.error("[portal/db] fetchPublishedLessonById module", modErr.message);
    return null;
  }
  if (!mod) return null;

  return mapLesson(row);
}

export async function upsertLessonCompleted(
  studentId: string,
  lessonId: string,
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      student_id: studentId,
      lesson_id: lessonId,
      completed: true,
      completed_at: now,
      updated_at: now,
    },
    { onConflict: "student_id,lesson_id" },
  );

  if (error) {
    console.error("[portal/db] upsertLessonCompleted", error.message);
    return false;
  }
  return true;
}

export { mapStudent, mapModule, mapLesson, mapProgress };