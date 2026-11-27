import type { CourseLesson, LessonProgress } from "./types";
import {
  fetchLessonProgressForStudent,
  listPublishedModulesWithLessons,
} from "./db";

export const PORTAL_LOGIN_FAIL_MSG = "Invalid credentials or inactive account";

export type PortalLessonListItem = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  duration_seconds: number | null;
};

export type PortalModuleListItem = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: PortalLessonListItem[];
};

export function completedLessonIdsFromProgress(
  rows: LessonProgress[],
): string[] {
  return rows.filter((r) => r.completed).map((r) => r.lesson_id);
}

export function countPublishedLessons(
  modules: { lessons: { id: string }[] }[],
): number {
  let total = 0;
  for (const m of modules) total += m.lessons.length;
  return total;
}

export function computeProgressPercent(
  totalLessons: number,
  completedCount: number,
): number {
  if (totalLessons === 0) return 0;
  return Math.round((completedCount / totalLessons) * 100);
}

export function flattenPublishedLessonIds(
  modules: { lessons: CourseLesson[] }[],
): string[] {
  const ids: string[] = [];
  for (const { lessons } of modules) {
    for (const lesson of lessons) {
      ids.push(lesson.id);
    }
  }
  return ids;
}

/** Next lesson after the last completed one in curriculum order. */
export function resolveNextLessonId(
  orderedLessonIds: string[],
  completedSet: Set<string>,
): string | null {
  if (orderedLessonIds.length === 0) return null;

  let lastCompletedIndex = -1;
  for (let i = 0; i < orderedLessonIds.length; i++) {
    if (completedSet.has(orderedLessonIds[i]!)) {
      lastCompletedIndex = i;
    }
  }

  if (lastCompletedIndex === -1) {
    return orderedLessonIds[0]!;
  }

  for (let i = lastCompletedIndex + 1; i < orderedLessonIds.length; i++) {
    const id = orderedLessonIds[i]!;
    if (!completedSet.has(id)) return id;
  }

  for (let i = 0; i < orderedLessonIds.length; i++) {
    const id = orderedLessonIds[i]!;
    if (!completedSet.has(id)) return id;
  }

  return orderedLessonIds[orderedLessonIds.length - 1]!;
}

export async function loadPublishedCurriculum() {
  const modulesWithLessons = await listPublishedModulesWithLessons();
  const modules: PortalModuleListItem[] = modulesWithLessons.map(
    ({ module, lessons }) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      sort_order: module.sort_order,
      lessons: lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        sort_order: l.sort_order,
        duration_seconds: l.duration_seconds,
      })),
    }),
  );
  const orderedIds = flattenPublishedLessonIds(modulesWithLessons);
  const lessonById = new Map<string, CourseLesson>();
  for (const { lessons } of modulesWithLessons) {
    for (const lesson of lessons) {
      lessonById.set(lesson.id, lesson);
    }
  }
  return { modules, orderedIds, lessonById };
}

/** Post-login / portal home target — matches `src/app/portal/page.tsx` redirect logic. */
export async function resolvePortalHomeRedirect(
  studentId: string,
): Promise<string> {
  const { orderedIds } = await loadPublishedCurriculum();
  if (orderedIds.length === 0) {
    return "/portal";
  }
  const progressRows = await fetchLessonProgressForStudent(studentId);
  const completedSet = new Set(completedLessonIdsFromProgress(progressRows));
  const nextLessonId = resolveNextLessonId(orderedIds, completedSet);
  if (nextLessonId) {
    return `/portal/lesson/${nextLessonId}`;
  }
  return "/portal";
}