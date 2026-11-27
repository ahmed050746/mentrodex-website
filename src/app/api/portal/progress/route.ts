import { getCurrentStudent } from "@/lib/portal/auth";
import {
  completedLessonIdsFromProgress,
  computeProgressPercent,
  countPublishedLessons,
  loadPublishedCurriculum,
} from "@/lib/portal/courseSnapshot";
import {
  fetchLessonProgressForStudent,
  fetchPublishedLessonById,
  upsertLessonCompleted,
} from "@/lib/portal/db";
import { portalJsonError, portalJsonOk } from "@/lib/portal/errors";
import { isUuid } from "@/lib/portal/validation";

export async function POST(request: Request) {
  const student = await getCurrentStudent();
  if (!student) {
    return portalJsonError("Unauthorized.", 401);
  }

  let body: { lessonId?: unknown };
  try {
    body = (await request.json()) as { lessonId?: unknown };
  } catch {
    return portalJsonError("Invalid JSON.", 400);
  }

  const lessonId =
    typeof body.lessonId === "string" ? body.lessonId.trim() : "";
  if (!lessonId || !isUuid(lessonId)) {
    return portalJsonError("Invalid lesson id.", 400);
  }

  const lesson = await fetchPublishedLessonById(lessonId);
  if (!lesson) {
    return portalJsonError("Lesson not found.", 404);
  }

  const saved = await upsertLessonCompleted(student.id, lessonId);
  if (!saved) {
    return portalJsonError("Could not save progress.", 500);
  }

  const { modules } = await loadPublishedCurriculum();
  const progressRows = await fetchLessonProgressForStudent(student.id);
  const completedLessonIds = completedLessonIdsFromProgress(progressRows);
  const totalLessons = countPublishedLessons(modules);
  const completedCount = completedLessonIds.length;
  const percent = computeProgressPercent(totalLessons, completedCount);

  return portalJsonOk({
    completedLessonIds,
    completedCount,
    totalLessons,
    percent,
  });
}