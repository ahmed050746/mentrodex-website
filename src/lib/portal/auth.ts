import type { PortalStudent } from "./types";
import { fetchActiveStudentById } from "./db";
import {
  readPortalSessionTokenFromCookies,
  verifyPortalSessionToken,
} from "./session";

/**
 * Validates signed cookie and re-checks DB: student exists and is_active.
 */
export async function getAuthenticatedPortalStudent(): Promise<PortalStudent | null> {
  const token = await readPortalSessionTokenFromCookies();
  if (!token) return null;

  const studentId = verifyPortalSessionToken(token);
  if (!studentId) return null;

  return fetchActiveStudentById(studentId);
}