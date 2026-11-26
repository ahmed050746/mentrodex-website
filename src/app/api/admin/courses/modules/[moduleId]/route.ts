import { requireAdminCoursesApiAuth } from "@/lib/portal/adminGate";
import {
  friendlyUniqueError,
  moduleWithLessons,
  toAdminLesson,
  toAdminModule,
} from "@/lib/portal/adminSerialize";
import { portalJsonError, portalJsonOk } from "@/lib/portal/errors";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { isUuid, validateTitle } from "@/lib/portal/validation";

type RouteContext = { params: Promise<{ moduleId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdminCoursesApiAuth();
  if (denied) return denied;

  const { moduleId } = await context.params;
  if (!isUuid(moduleId)) {
    return portalJsonError("Invalid module id.", 400);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return portalJsonError("Invalid JSON.", 400);
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.title !== undefined) {
    const title = validateTitle(body.title);
    if (!title) {
      return portalJsonError("Invalid module title.", 400);
    }
    patch.title = title;
  }
  if (body.description !== undefined) {
    patch.description =
      body.description == null || body.description === ""
        ? null
        : String(body.description).trim().slice(0, 4000);
  }
  if (body.sort_order !== undefined) {
    const sort_order = Number(body.sort_order);
    if (!Number.isFinite(sort_order)) {
      return portalJsonError("sort_order must be a number.", 400);
    }
    patch.sort_order = Math.floor(sort_order);
  }
  if (body.is_published !== undefined) {
    patch.is_published = Boolean(body.is_published);
  }

  if (Object.keys(patch).length === 1) {
    return portalJsonError("Nothing to update.", 400);
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("course_modules")
      .update(patch)
      .eq("id", moduleId)
      .select("*")
      .maybeSingle();

    if (error) {
      const friendly = friendlyUniqueError(error.message);
      console.error("[admin/courses/modules] patch", error.message);
      return portalJsonError(friendly ?? "Could not update module.", 400);
    }
    if (!data) {
      return portalJsonError("Module not found.", 404);
    }

    const { data: lessons } = await supabase
      .from("course_lessons")
      .select("*")
      .eq("module_id", moduleId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    const mod = toAdminModule(data as Record<string, unknown>);
    const lessonDtos = ((lessons ?? []) as Record<string, unknown>[]).map(
      toAdminLesson,
    );
    return portalJsonOk({ module: moduleWithLessons(mod, lessonDtos) });
  } catch {
    return portalJsonError("Could not update module.", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requireAdminCoursesApiAuth();
  if (denied) return denied;

  const { moduleId } = await context.params;
  if (!isUuid(moduleId)) {
    return portalJsonError("Invalid module id.", 400);
  }

  try {
    const supabase = createServiceRoleClient();
    const { error, count } = await supabase
      .from("course_modules")
      .delete({ count: "exact" })
      .eq("id", moduleId);

    if (error) {
      console.error("[admin/courses/modules] delete", error.message);
      return portalJsonError("Could not delete module.", 500);
    }
    if (!count) {
      return portalJsonError("Module not found.", 404);
    }

    return portalJsonOk({ deleted: true });
  } catch {
    return portalJsonError("Could not delete module.", 500);
  }
}