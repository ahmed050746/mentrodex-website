import { requireAdminCoursesApiAuth } from "@/lib/portal/adminGate";
import { friendlyUniqueError, toAdminLesson } from "@/lib/portal/adminSerialize";
import { extractBunnyRefForStorage } from "@/lib/portal/bunnyInput";
import { portalJsonError, portalJsonOk } from "@/lib/portal/errors";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { isUuid, validateTitle } from "@/lib/portal/validation";

function resolveBunnyInput(body: Record<string, unknown>): string | null {
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

export async function POST(request: Request) {
  const denied = await requireAdminCoursesApiAuth();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return portalJsonError("Invalid JSON.", 400);
  }

  const module_id = String(body.module_id ?? "");
  if (!isUuid(module_id)) {
    return portalJsonError("Valid module_id is required.", 400);
  }

  const title = validateTitle(body.title);
  if (!title) {
    return portalJsonError("Lesson title is required (1–200 characters).", 400);
  }

  const bunny_ref = resolveBunnyInput(body);
  if (!bunny_ref) {
    return portalJsonError(
      "Paste a Bunny embed URL or iframe snippet with a valid library/video id.",
      400,
    );
  }

  const description =
    body.description == null || body.description === ""
      ? null
      : String(body.description).trim().slice(0, 4000);

  const sort_order =
    body.sort_order === undefined ? 0 : Number(body.sort_order);
  if (!Number.isFinite(sort_order)) {
    return portalJsonError("sort_order must be a number.", 400);
  }

  const is_published = Boolean(body.is_published);
  const duration_seconds =
    body.duration_seconds == null || body.duration_seconds === ""
      ? null
      : Math.max(0, Math.floor(Number(body.duration_seconds)));

  try {
    const supabase = createServiceRoleClient();
    const { data: mod, error: modErr } = await supabase
      .from("course_modules")
      .select("id")
      .eq("id", module_id)
      .maybeSingle();

    if (modErr) {
      console.error("[admin/courses/lessons] module", modErr.message);
      return portalJsonError("Could not verify module.", 500);
    }
    if (!mod) {
      return portalJsonError("Module not found.", 404);
    }

    const { data, error } = await supabase
      .from("course_lessons")
      .insert({
        module_id,
        title,
        description,
        bunny_ref,
        sort_order: Math.floor(sort_order),
        is_published,
        duration_seconds:
          duration_seconds != null && Number.isFinite(duration_seconds)
            ? duration_seconds
            : null,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      const friendly = friendlyUniqueError(error.message);
      console.error("[admin/courses/lessons] insert", error.message);
      return portalJsonError(friendly ?? "Could not create lesson.", 400);
    }

    return portalJsonOk(
      { lesson: toAdminLesson(data as Record<string, unknown>) },
      201,
    );
  } catch {
    return portalJsonError("Could not create lesson.", 500);
  }
}