import { requireAdminCoursesApiAuth } from "@/lib/portal/adminGate";
import { friendlyUniqueError, toAdminStudent } from "@/lib/portal/adminSerialize";
import { portalJsonError, portalJsonOk } from "@/lib/portal/errors";
import { hashPortalPassword } from "@/lib/portal/password";
import { parseStudentCreateBody } from "@/lib/portal/studentFields";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

const STUDENT_LIST_COLS =
  "id, display_name, email, phone_e164, is_active, created_at";

function escapeIlike(q: string): string {
  return q.replace(/[%_,]/g, "");
}

export async function GET(request: Request) {
  const denied = await requireAdminCoursesApiAuth();
  if (denied) return denied;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  try {
    const supabase = createServiceRoleClient();
    let query = supabase
      .from("students")
      .select(STUDENT_LIST_COLS)
      .order("created_at", { ascending: false });

    if (q) {
      const needle = escapeIlike(q);
      const pattern = `%${needle}%`;
      query = query.or(
        `display_name.ilike.${pattern},email.ilike.${pattern},phone_e164.ilike.${pattern}`,
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("[admin/courses/students] list", error.message);
      return portalJsonError("Could not load students.", 500);
    }

    const students = ((data ?? []) as Record<string, unknown>[]).map(
      toAdminStudent,
    );
    return portalJsonOk({ students });
  } catch {
    return portalJsonError("Could not load students.", 500);
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

  const parsed = parseStudentCreateBody(body);
  if ("error" in parsed) {
    return portalJsonError(parsed.error, 400);
  }

  const { data: fields } = parsed;
  const password_hash = await hashPortalPassword(fields.password);

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("students")
      .insert({
        display_name: fields.display_name,
        email: fields.email,
        phone_e164: fields.phone_e164,
        password_hash,
        is_active: fields.is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .select(STUDENT_LIST_COLS)
      .single();

    if (error) {
      const friendly = friendlyUniqueError(error.message);
      console.error("[admin/courses/students] insert", error.message);
      return portalJsonError(
        friendly ?? "Could not create student.",
        friendly ? 409 : 400,
      );
    }

    return portalJsonOk(
      { student: toAdminStudent(data as Record<string, unknown>) },
      201,
    );
  } catch {
    return portalJsonError("Could not create student.", 500);
  }
}