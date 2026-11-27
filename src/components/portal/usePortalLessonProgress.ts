"use client";

import { useCallback, useState } from "react";
import { computeProgressPercent } from "@/lib/portal/courseSnapshot";

type ProgressApiOk = {
  ok: true;
  completedLessonIds: string[];
  completedCount: number;
  totalLessons: number;
  percent: number;
};

type Snapshot = {
  completedIds: Set<string>;
  completedCount: number;
  progressPercent: number;
};

export function usePortalLessonProgress(
  initialCompletedIds: string[],
  initialCompletedCount: number,
  initialProgressPercent: number,
  totalLessons: number,
) {
  const [completedIds, setCompletedIds] = useState(
    () => new Set(initialCompletedIds),
  );
  const [completedCount, setCompletedCount] = useState(initialCompletedCount);
  const [progressPercent, setProgressPercent] = useState(initialProgressPercent);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  const snapshot = useCallback(
    (): Snapshot => ({
      completedIds: new Set(completedIds),
      completedCount,
      progressPercent,
    }),
    [completedIds, completedCount, progressPercent],
  );

  const restore = useCallback((prev: Snapshot) => {
    setCompletedIds(prev.completedIds);
    setCompletedCount(prev.completedCount);
    setProgressPercent(prev.progressPercent);
  }, []);

  const applyServer = useCallback((body: ProgressApiOk) => {
    setCompletedIds(new Set(body.completedLessonIds));
    setCompletedCount(body.completedCount);
    setProgressPercent(body.percent);
  }, []);

  const markLessonComplete = useCallback(
    async (lessonId: string): Promise<boolean> => {
      if (completedIds.has(lessonId)) return true;

      setProgressError(null);
      const prev = snapshot();

      const optimistic = new Set(completedIds);
      optimistic.add(lessonId);
      const nextCount = optimistic.size;
      const nextPercent = computeProgressPercent(totalLessons, nextCount);
      setCompletedIds(optimistic);
      setCompletedCount(nextCount);
      setProgressPercent(nextPercent);

      setMarking(true);
      try {
        const res = await fetch("/api/portal/progress", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId }),
        });
        const json = (await res.json()) as ProgressApiOk | { ok?: false; error?: string };

        if (!res.ok || !json.ok) {
          restore(prev);
          setProgressError(
            "error" in json && json.error
              ? json.error
              : "Could not save progress. Try again.",
          );
          return false;
        }

        applyServer(json);
        return true;
      } catch {
        restore(prev);
        setProgressError("Network error. Progress was not saved.");
        return false;
      } finally {
        setMarking(false);
      }
    },
    [applyServer, completedIds, restore, snapshot, totalLessons],
  );

  return {
    completedIds,
    completedCount,
    progressPercent,
    progressError,
    marking,
    markLessonComplete,
    setProgressError,
  };
}