import { requireAdminCoursesApiAuth } from "@/lib/portal/adminGate";
import { friendlyUniqueError, toAdminLesson } from "@/lib/portal/adminSerialize";
import { extractBunnyRefForStorage } from "@/lib/portal/bunnyInput";
import { portalJsonError, portalJsonOk } from "@/lib/portal/errors";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { isUuid, validateTitle } from "@/lib/portal/validation";

function resolveBunnyInput(body: Record<string, unknown>): string | null | undefined {
  const hasField =
    body.bunny_ref !== undefined ||
    body.bunny_input !== undefined ||
    body.bunny_url !== undefined ||
    body.bunny_embed !== undefined ||
    body.embed !== undefined;
  if (!hasField) return undefined;
  const raw =
    body.bunny_ref ??
    body.bunny_input ??
    body.bunny_url ??
    body.bunny_embed ??
    body.embed;
  return extractBunnyRefForStorage(
    typeof raw === "string" ? raw : String(raw ?? ""),
  );
}

type RouteContext = { params: Promise<{ lessonId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdminCoursesApiAuth();
  if (denied) return denied;

  const { lessonId } = await context.params;
  if (!isUuid(lessonId)) {
    return portalJsonError("Invalid lesson id.", 400);
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
      return portalJsonError("Invalid lesson title.", 400);
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
  if (body.duration_seconds !== undefined) {
    patch.duration_seconds =
      body.duration_seconds == null || body.duration_seconds === ""
        ? null
        : Math.max(0, Math.floor(Number(body.duration_seconds)));
  }

  const bunny = resolveBunnyInput(body);
  if (body.bunny_ref !== undefined || body.bunny_input !== undefined) {
    if (!bunny) {
      return portalJsonError("Invalid Bunny embed URL or iframe snippet.", 400);
    }
    patch.bunny_ref = bunny;
  }

  if (Object.keys(patch).length === 1) {
    return portalJsonError("Nothing to update.", 400);
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("course_lessons")
      .update(patch)
      .eq("id", lessonId)
      .select("*")
      .maybeSingle();

    if (error) {
      const friendly = friendlyUniqueError(error.message);
      console.error("[admin/courses/lessons] patch", error.message);
      return portalJsonError(friendly ?? "Could not update lesson.", 400);
    }
    if (!data) {
      return portalJsonError("Lesson not found.", 404);
    }

    return portalJsonOk({ lesson: toAdminLesson(data as Record<string, unknown>) });
  } catch {
    return portalJsonError("Could not update lesson.", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requireAdminCoursesApiAuth();
  if (denied) return denied;

  const { lessonId } = await context.params;
  if (!isUuid(lessonId)) {
    return portalJsonError("Invalid lesson id.", 400);
  }

  try {
    const supabase = createServiceRoleClient();
    const { error, count } = await supabase
      .from("course_lessons")
      .delete({ count: "exact" })
      .eq("id", lessonId);

    if (error) {
      console.error("[admin/courses/lessons] delete", error.message);
      return portalJsonError("Could not delete lesson.", 500);
    }
    if (!count) {
      return portalJsonError("Lesson not found.", 404);
    }

    return portalJsonOk({ deleted: true });
  } catch {
    return portalJsonError("Could not delete lesson.", 500);
  }
}