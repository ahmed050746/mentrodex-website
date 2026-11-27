import type { PortalStudent } from "./types";
import { fetchActiveStudentById } from "./db";
import {
  clearPortalSessionCookie,
  readPortalSessionTokenFromCookies,
  verifyPortalSessionToken,
} from "./session";

/** Validates signed cookie and re-checks DB: student exists and `is_active`. */
export async function getCurrentStudent(): Promise<PortalStudent | null> {
  const token = await readPortalSessionTokenFromCookies();
  if (!token) return null;

  const studentId = verifyPortalSessionToken(token);
  if (!studentId) {
    await clearPortalSessionCookie();
    return null;
  }

  const student = await fetchActiveStudentById(studentId);
  if (!student) {
    await clearPortalSessionCookie();
    return null;
  }

  return student;
}

/** @deprecated Use `getCurrentStudent`. */
export async function getAuthenticatedPortalStudent(): Promise<PortalStudent | null> {
  return getCurrentStudent();
}