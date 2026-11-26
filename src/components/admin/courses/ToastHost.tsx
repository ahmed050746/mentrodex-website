"use client";

import type { ToastItem } from "./useAdminToast";
import styles from "./admin-courses.module.css";

export function ToastHost({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className={styles.toastHost} aria-live="polite">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`${styles.toast} ${
            t.tone === "success" ? styles.toastSuccess : styles.toastError
          }`}
          onClick={() => onDismiss(t.id)}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}