import { getCurrentStudent } from "@/lib/portal/auth";
import {
  completedLessonIdsFromProgress,
  computeProgressPercent,
  countPublishedLessons,
  loadPublishedCurriculum,
} from "@/lib/portal/courseSnapshot";
import { fetchLessonProgressForStudent } from "@/lib/portal/db";
import { portalJsonError, portalJsonOk } from "@/lib/portal/errors";

export async function GET() {
  const student = await getCurrentStudent();
  if (!student) {
    return portalJsonError("Unauthorized.", 401);
  }

  const { modules } = await loadPublishedCurriculum();
  const progressRows = await fetchLessonProgressForStudent(student.id);
  const completedLessonIds = completedLessonIdsFromProgress(progressRows);
  const totalLessons = countPublishedLessons(modules);
  const completedCount = completedLessonIds.length;
  const percent = computeProgressPercent(totalLessons, completedCount);

  return portalJsonOk({
    student: {
      id: student.id,
      display_name: student.display_name,
      email: student.email,
      phone_e164: student.phone_e164,
    },
    modules,
    completedLessonIds,
    totalLessons,
    completedCount,
    percent,
  });
}