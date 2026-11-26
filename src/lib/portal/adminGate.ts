import { isAdminOrdersAuthed } from "@/lib/adminOrdersSession";
import { portalJsonError } from "./errors";

/** Use at the top of `/api/admin/courses/*` handlers. Returns a 401 response or null if OK. */
export async function requireAdminCoursesApiAuth() {
  if (!(await isAdminOrdersAuthed())) {
    return portalJsonError("Unauthorized.", 401);
  }
  return null;
}

export async function isAdminCoursesAuthed(): Promise<boolean> {
  return isAdminOrdersAuthed();
}