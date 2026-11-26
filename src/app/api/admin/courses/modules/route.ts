import { requireAdminCoursesApiAuth } from "@/lib/portal/adminGate";
import {
  friendlyUniqueError,
  moduleWithLessons,
  toAdminLesson,
  toAdminModule,
} from "@/lib/portal/adminSerialize";
import { portalJsonError, portalJsonOk } from "@/lib/portal/errors";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { validateTitle } from "@/lib/portal/validation";

export async function GET() {
  const denied = await requireAdminCoursesApiAuth();
  if (denied) return denied;

  try {
    const supabase = createServiceRoleClient();
    const { data: modules, error: modErr } = await supabase
      .from("course_modules")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (modErr) {
      console.error("[admin/courses/modules]", modErr.message);
      return portalJsonError("Could not load modules.", 500);
    }

    const moduleRows = (modules ?? []) as Record<string, unknown>[];
    const moduleIds = moduleRows.map((m) => String(m.id));

    let lessonRows: Record<string, unknown>[] = [];
    if (moduleIds.length > 0) {
      const { data: lessons, error: lesErr } = await supabase
        .from("course_lessons")
        .select("*")
        .in("module_id", moduleIds)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (lesErr) {
        console.error("[admin/courses/modules] lessons", lesErr.message);
        return portalJsonError("Could not load lessons.", 500);
      }
      lessonRows = (lessons ?? []) as Record<string, unknown>[];
    }

    const byModule = new Map<string, ReturnType<typeof toAdminLesson>[]>();
    for (const row of lessonRows) {
      const lesson = toAdminLesson(row);
      const list = byModule.get(lesson.module_id);
      if (list) list.push(lesson);
      else byModule.set(lesson.module_id, [lesson]);
    }

    const payload = moduleRows.map((row) => {
      const mod = toAdminModule(row);
      return moduleWithLessons(mod, byModule.get(mod.id) ?? []);
    });

    return portalJsonOk({ modules: payload });
  } catch {
    return portalJsonError("Could not load modules.", 500);
  }
}

export async function POST(request: Request) {
  const denied = await requireAdminCoursesApiAuth();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return portalJsonError("Invalid JSON.", 400);
  }

  const title = validateTitle(body.title);
  if (!title) {
    return portalJsonError("Module title is required (1–200 characters).", 400);
  }

  const description =
    body.description == null || body.description === ""
      ? null
      : String(body.description).trim().slice(0, 4000);

  const sort_order =
    body.sort_order === undefined
      ? 0
      : Number(body.sort_order);
  if (!Number.isFinite(sort_order)) {
    return portalJsonError("sort_order must be a number.", 400);
  }

  const is_published = Boolean(body.is_published);

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("course_modules")
      .insert({
        title,
        description,
        sort_order: Math.floor(sort_order),
        is_published,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      const friendly = friendlyUniqueError(error.message);
      console.error("[admin/courses/modules] insert", error.message);
      return portalJsonError(friendly ?? "Could not create module.", 400);
    }

    const mod = toAdminModule(data as Record<string, unknown>);
    return portalJsonOk({ module: moduleWithLessons(mod, []) }, 201);
  } catch {
    return portalJsonError("Could not create module.", 500);
  }
}