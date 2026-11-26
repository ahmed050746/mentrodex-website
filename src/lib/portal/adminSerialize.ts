import type { CourseLesson, CourseModule, PortalStudent } from "./types";

export type AdminModuleDto = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
};

export type AdminLessonDto = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  bunny_ref: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
};

export type AdminStudentDto = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone_e164: string | null;
  is_active: boolean;
  created_at: string;
};

export function toAdminModule(row: Record<string, unknown>): AdminModuleDto {
  return {
    id: String(row.id),
    title: String(row.title),
    description: row.description != null ? String(row.description) : null,
    sort_order: Number(row.sort_order) || 0,
    is_published: Boolean(row.is_published),
    created_at: String(row.created_at),
  };
}

export function toAdminLesson(row: Record<string, unknown>): AdminLessonDto {
  return {
    id: String(row.id),
    module_id: String(row.module_id),
    title: String(row.title),
    description: row.description != null ? String(row.description) : null,
    bunny_ref: String(row.bunny_ref),
    sort_order: Number(row.sort_order) || 0,
    is_published: Boolean(row.is_published),
    created_at: String(row.created_at),
  };
}

export function toAdminStudent(row: Record<string, unknown>): AdminStudentDto {
  return {
    id: String(row.id),
    display_name: row.display_name != null ? String(row.display_name) : null,
    email: row.email != null ? String(row.email) : null,
    phone_e164: row.phone_e164 != null ? String(row.phone_e164) : null,
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
  };
}

export function friendlyUniqueError(message: string): string | null {
  const m = message.toLowerCase();
  if (m.includes("students_email_unique")) {
    return "A student with this email already exists.";
  }
  if (m.includes("students_phone_e164_unique")) {
    return "A student with this phone number already exists.";
  }
  if (m.includes("duplicate key")) {
    if (m.includes("email")) return "A student with this email already exists.";
    if (m.includes("phone")) return "A student with this phone number already exists.";
    return "This record already exists.";
  }
  return null;
}

export type ModuleWithLessonsDto = AdminModuleDto & {
  lessons: AdminLessonDto[];
};

export function moduleWithLessons(
  mod: CourseModule | AdminModuleDto,
  lessons: (CourseLesson | AdminLessonDto)[],
): ModuleWithLessonsDto {
  return {
    id: mod.id,
    title: mod.title,
    description: mod.description,
    sort_order: mod.sort_order,
    is_published: mod.is_published,
    created_at: mod.created_at,
    lessons: lessons.map((l) =>
      "module_id" in l && "bunny_ref" in l
        ? {
            id: l.id,
            module_id: l.module_id,
            title: l.title,
            description: l.description,
            bunny_ref: l.bunny_ref,
            sort_order: l.sort_order,
            is_published: l.is_published,
            created_at: l.created_at,
          }
        : (l as AdminLessonDto),
    ),
  };
}

export function toAdminStudentFromPortal(s: PortalStudent): AdminStudentDto {
  return {
    id: s.id,
    display_name: s.display_name,
    email: s.email,
    phone_e164: s.phone_e164,
    is_active: s.is_active,
    created_at: s.created_at,
  };
}