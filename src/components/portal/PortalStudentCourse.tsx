"use client";

import Link from "next/link";
import { useCallback } from "react";
import type { PortalModuleListItem } from "@/lib/portal/courseSnapshot";
import { PortalBunnyPlayer } from "./PortalBunnyPlayer";
import { PortalLogoutButton } from "./PortalLogoutButton";
import { usePortalLessonProgress } from "./usePortalLessonProgress";
import styles from "./portal.module.css";

type Props = {
  displayName: string | null;
  activeLessonId: string;
  activeLessonTitle: string;
  activeLessonDescription: string | null;
  bunnyRef: string;
  modules: PortalModuleListItem[];
  orderedLessonIds: string[];
  completedLessonIds: string[];
  progressPercent: number;
  completedCount: number;
  totalLessons: number;
};

function formatDuration(seconds: number | null): string | null {
  if (seconds == null || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m} min`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function lessonNeighbors(orderedIds: string[], activeId: string) {
  const index = orderedIds.indexOf(activeId);
  if (index < 0) {
    return { prevId: null as string | null, nextId: null as string | null };
  }
  return {
    prevId: index > 0 ? (orderedIds[index - 1] ?? null) : null,
    nextId:
      index < orderedIds.length - 1
        ? (orderedIds[index + 1] ?? null)
        : null,
  };
}

export function PortalStudentCourse({
  displayName,
  activeLessonId,
  activeLessonTitle,
  activeLessonDescription,
  bunnyRef,
  modules,
  orderedLessonIds,
  completedLessonIds,
  progressPercent: initialPercent,
  completedCount: initialCount,
  totalLessons,
}: Props) {
  const name = displayName?.trim() || "Student";

  const {
    completedIds,
    completedCount,
    progressPercent,
    progressError,
    markLessonComplete,
  } = usePortalLessonProgress(
    completedLessonIds,
    initialCount,
    initialPercent,
    totalLessons,
  );

  const isActiveComplete = completedIds.has(activeLessonId);
  const { prevId, nextId } = lessonNeighbors(orderedLessonIds, activeLessonId);

  const handleAutoComplete = useCallback(() => {
    void markLessonComplete(activeLessonId);
  }, [activeLessonId, markLessonComplete]);

  return (
    <div className={styles.courseLayout}>
      <header className={styles.courseHeader}>
        <div className={styles.courseHeaderMain}>
          <p className={styles.brand} aria-label="Mentrodex">
            Mentrodex
          </p>
          <p className={styles.courseWelcome}>
            Welcome, <strong>{name}</strong>
          </p>
        </div>
        <div className={styles.courseProgressWrap}>
          <div
            className={styles.courseProgressBar}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Course progress"
          >
            <div
              className={styles.courseProgressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className={styles.courseProgressLabel}>
            {completedCount} of {totalLessons} lessons · {progressPercent}%
          </p>
        </div>
        <PortalLogoutButton />
      </header>

      <div className={styles.courseBody}>
        <aside className={styles.courseSidebar} aria-label="Course outline">
          <h2 className={styles.courseSidebarTitle}>Your course</h2>
          <ol className={styles.moduleList}>
            {modules.map((mod) => (
              <li key={mod.id} className={styles.moduleItem}>
                <p className={styles.moduleTitle}>{mod.title}</p>
                {mod.description ? (
                  <p className={styles.moduleDesc}>{mod.description}</p>
                ) : null}
                <ul className={styles.lessonList}>
                  {mod.lessons.map((lesson) => {
                    const done = completedIds.has(lesson.id);
                    const active = lesson.id === activeLessonId;
                    const duration = formatDuration(lesson.duration_seconds);
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/portal/lesson/${lesson.id}`}
                          className={
                            active
                              ? `${styles.lessonLink} ${styles.lessonLinkActive}`
                              : styles.lessonLink
                          }
                          aria-current={active ? "page" : undefined}
                        >
                          <span
                            className={
                              done ? styles.lessonCheckDone : styles.lessonCheck
                            }
                            aria-hidden
                          >
                            {done ? "✓" : "○"}
                          </span>
                          <span className={styles.lessonLinkText}>
                            <span className={styles.lessonLinkTitle}>
                              {lesson.title}
                            </span>
                            {duration ? (
                              <span className={styles.lessonDuration}>
                                {duration}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        </aside>

        <main className={styles.courseMain}>
          <h1 className={styles.courseLessonHeading}>{activeLessonTitle}</h1>
          {activeLessonDescription ? (
            <p className={styles.courseLessonDesc}>{activeLessonDescription}</p>
          ) : null}
          <PortalBunnyPlayer
            bunnyRef={bunnyRef}
            title={activeLessonTitle}
            lessonId={activeLessonId}
            onAutoComplete={handleAutoComplete}
          />

          <div className={styles.lessonActions}>
            {prevId ? (
              <Link
                href={`/portal/lesson/${prevId}`}
                className={`${styles.btnGhost} ${styles.lessonNavBtn}`}
              >
                ← Previous
              </Link>
            ) : (
              <span
                className={`${styles.btnGhost} ${styles.lessonNavBtn} ${styles.lessonNavBtnDisabled}`}
                aria-disabled
              >
                ← Previous
              </span>
            )}

            <span className={styles.lessonActionsSpacer} aria-hidden />

            {isActiveComplete ? (
              <span className={styles.lessonCompletedBadge} role="status">
                ✓ Completed
              </span>
            ) : null}

            {nextId ? (
              <Link
                href={`/portal/lesson/${nextId}`}
                className={`${styles.btnGhost} ${styles.lessonNavBtn}`}
              >
                Next →
              </Link>
            ) : (
              <span
                className={`${styles.btnGhost} ${styles.lessonNavBtn} ${styles.lessonNavBtnDisabled}`}
                aria-disabled
              >
                Next →
              </span>
            )}
          </div>

          {progressError ? (
            <p className={styles.error} role="alert">
              {progressError}
            </p>
          ) : null}
        </main>
      </div>
    </div>
  );
}