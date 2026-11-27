import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
} from "@/lib/portal/db";
import { PortalStudentCourse } from "@/components/portal/PortalStudentCourse";
import { isUuid } from "@/lib/portal/validation";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export const metadata: Metadata = {
  title: "Lesson",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function PortalLessonPage({ params }: PageProps) {
  const { lessonId } = await params;

  await cookies();

  const student = await getCurrentStudent();
  if (!student) {
    redirect("/portal");
  }

  const { modules, orderedIds, lessonById } = await loadPublishedCurriculum();

  if (orderedIds.length === 0) {
    redirect("/portal");
  }

  const firstLessonId = orderedIds[0]!;

  if (!isUuid(lessonId)) {
    redirect(`/portal/lesson/${firstLessonId}`);
  }

  const lesson = await fetchPublishedLessonById(lessonId);
  if (!lesson) {
    redirect(`/portal/lesson/${firstLessonId}`);
  }

  const fromCache = lessonById.get(lessonId);
  const title = fromCache?.title ?? lesson.title;
  const description = fromCache?.description ?? lesson.description;
  const bunnyRef = fromCache?.bunny_ref ?? lesson.bunny_ref;

  const progressRows = await fetchLessonProgressForStudent(student.id);
  const completedIds = completedLessonIdsFromProgress(progressRows);
  const totalLessons = countPublishedLessons(modules);
  const completedCount = completedIds.length;
  const progressPercent = computeProgressPercent(totalLessons, completedCount);

  return (
    <PortalStudentCourse
      displayName={student.display_name}
      activeLessonId={lessonId}
      activeLessonTitle={title}
      activeLessonDescription={description}
      bunnyRef={bunnyRef}
      modules={modules}
      orderedLessonIds={orderedIds}
      completedLessonIds={completedIds}
      progressPercent={progressPercent}
      completedCount={completedCount}
      totalLessons={totalLessons}
    />
  );
}