import { requireAdminCoursesApiAuth } from "@/lib/portal/adminGate";
import { friendlyUniqueError, toAdminStudent } from "@/lib/portal/adminSerialize";
import { portalJsonError, portalJsonOk } from "@/lib/portal/errors";
import { hashPortalPassword } from "@/lib/portal/password";
import { parseStudentPatchBody } from "@/lib/portal/studentFields";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { isUuid } from "@/lib/portal/validation";

const STUDENT_LIST_COLS =
  "id, display_name, email, phone_e164, is_active, created_at";

type RouteContext = { params: Promise<{ studentId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdminCoursesApiAuth();
  if (denied) return denied;

  const { studentId } = await context.params;
  if (!isUuid(studentId)) {
    return portalJsonError("Invalid student id.", 400);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return portalJsonError("Invalid JSON.", 400);
  }

  const parsed = parseStudentPatchBody(body);
  if ("error" in parsed) {
    return portalJsonError(parsed.error, 400);
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const fields = parsed.data;
  if (fields.display_name !== undefined) patch.display_name = fields.display_name;
  if (fields.email !== undefined) patch.email = fields.email;
  if (fields.phone_e164 !== undefined) patch.phone_e164 = fields.phone_e164;
  if (fields.is_active !== undefined) patch.is_active = fields.is_active;
  if (fields.password) {
    patch.password_hash = await hashPortalPassword(fields.password);
  }

  if (Object.keys(patch).length === 1) {
    return portalJsonError("Nothing to update.", 400);
  }

  try {
    const supabase = createServiceRoleClient();

    if (
      fields.email === null ||
      fields.phone_e164 === null ||
      fields.email !== undefined ||
      fields.phone_e164 !== undefined
    ) {
      const { data: current, error: curErr } = await supabase
        .from("students")
        .select("email, phone_e164")
        .eq("id", studentId)
        .maybeSingle();

      if (curErr || !current) {
        if (!current) return portalJsonError("Student not found.", 404);
        return portalJsonError("Could not verify student.", 500);
      }

      const nextEmail =
        fields.email !== undefined ? fields.email : current.email;
      const nextPhone =
        fields.phone_e164 !== undefined
          ? fields.phone_e164
          : current.phone_e164;

      const hasEmail =
        nextEmail != null && String(nextEmail).trim() !== "";
      const hasPhone =
        nextPhone != null && String(nextPhone).trim() !== "";
      if (!hasEmail && !hasPhone) {
        return portalJsonError(
          "Student must keep at least one email or phone number.",
          400,
        );
      }
    }

    const { data, error } = await supabase
      .from("students")
      .update(patch)
      .eq("id", studentId)
      .select(STUDENT_LIST_COLS)
      .maybeSingle();

    if (error) {
      const friendly = friendlyUniqueError(error.message);
      console.error("[admin/courses/students] patch", error.message);
      return portalJsonError(
        friendly ?? "Could not update student.",
        friendly ? 409 : 400,
      );
    }
    if (!data) {
      return portalJsonError("Student not found.", 404);
    }

    return portalJsonOk({
      student: toAdminStudent(data as Record<string, unknown>),
    });
  } catch {
    return portalJsonError("Could not update student.", 500);
  }
}