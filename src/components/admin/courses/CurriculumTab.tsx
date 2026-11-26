"use client";

import { FormEvent, useState, type MouseEvent, type ReactNode } from "react";
import type { ModuleWithLessonsDto } from "@/lib/portal/adminSerialize";
import styles from "./admin-courses.module.css";

type ToastFn = (message: string, tone: "success" | "error") => void;

export function CurriculumTab({
  modules,
  loading,
  error,
  onRefresh,
  pushToast,
}: {
  modules: ModuleWithLessonsDto[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  pushToast: ToastFn;
}) {
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [creatingModule, setCreatingModule] = useState(false);

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    sort_order: 0,
    is_published: false,
  });

  const [lessonDraftModuleId, setLessonDraftModuleId] = useState<string | null>(
    null,
  );
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    bunny_input: "",
    sort_order: 0,
    is_published: false,
  });

  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonEditForm, setLessonEditForm] = useState({
    title: "",
    description: "",
    bunny_input: "",
    sort_order: 0,
    is_published: false,
  });

  async function createModule(e: FormEvent) {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    setCreatingModule(true);
    try {
      const res = await fetch("/api/admin/courses/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: newModuleTitle.trim(), sort_order: modules.length }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        pushToast(json.error ?? "Could not create module.", "error");
        return;
      }
      setNewModuleTitle("");
      pushToast("Module created.", "success");
      await onRefresh();
    } catch {
      pushToast("Network error.", "error");
    } finally {
      setCreatingModule(false);
    }
  }

  function startEditModule(mod: ModuleWithLessonsDto) {
    setEditingModuleId(mod.id);
    setModuleForm({
      title: mod.title,
      description: mod.description ?? "",
      sort_order: mod.sort_order,
      is_published: mod.is_published,
    });
  }

  async function saveModule(e: FormEvent) {
    e.preventDefault();
    if (!editingModuleId) return;
    try {
      const res = await fetch(`/api/admin/courses/modules/${editingModuleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...moduleForm,
          description: moduleForm.description || null,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        pushToast(json.error ?? "Could not update module.", "error");
        return;
      }
      setEditingModuleId(null);
      pushToast("Module updated.", "success");
      await onRefresh();
    } catch {
      pushToast("Network error.", "error");
    }
  }

  async function deleteModule(mod: ModuleWithLessonsDto) {
    const ok = window.confirm(
      `Delete module “${mod.title}”?\n\nThis will permanently delete all lessons in this module and all student progress for those lessons.`,
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/courses/modules/${mod.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        pushToast(json.error ?? "Could not delete module.", "error");
        return;
      }
      pushToast("Module deleted.", "success");
      await onRefresh();
    } catch {
      pushToast("Network error.", "error");
    }
  }

  function openLessonDraft(moduleId: string) {
    setLessonDraftModuleId(moduleId);
    const mod = modules.find((m) => m.id === moduleId);
    setLessonForm({
      title: "",
      description: "",
      bunny_input: "",
      sort_order: mod?.lessons.length ?? 0,
      is_published: false,
    });
  }

  async function createLesson(e: FormEvent) {
    e.preventDefault();
    if (!lessonDraftModuleId) return;
    try {
      const res = await fetch("/api/admin/courses/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          module_id: lessonDraftModuleId,
          title: lessonForm.title,
          description: lessonForm.description || null,
          bunny_input: lessonForm.bunny_input,
          sort_order: lessonForm.sort_order,
          is_published: lessonForm.is_published,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        pushToast(json.error ?? "Could not create lesson.", "error");
        return;
      }
      setLessonDraftModuleId(null);
      pushToast("Lesson created.", "success");
      await onRefresh();
    } catch {
      pushToast("Network error.", "error");
    }
  }

  function startEditLesson(mod: ModuleWithLessonsDto, lessonId: string) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    setEditingLessonId(lesson.id);
    setLessonEditForm({
      title: lesson.title,
      description: lesson.description ?? "",
      bunny_input: lesson.bunny_ref,
      sort_order: lesson.sort_order,
      is_published: lesson.is_published,
    });
  }

  async function saveLesson(e: FormEvent) {
    e.preventDefault();
    if (!editingLessonId) return;
    try {
      const res = await fetch(`/api/admin/courses/lessons/${editingLessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: lessonEditForm.title,
          description: lessonEditForm.description || null,
          bunny_input: lessonEditForm.bunny_input,
          sort_order: lessonEditForm.sort_order,
          is_published: lessonEditForm.is_published,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        pushToast(json.error ?? "Could not update lesson.", "error");
        return;
      }
      setEditingLessonId(null);
      pushToast("Lesson updated.", "success");
      await onRefresh();
    } catch {
      pushToast("Network error.", "error");
    }
  }

  async function deleteLesson(lessonId: string, title: string) {
    const ok = window.confirm(
      `Delete lesson “${title}”?\n\nAll student progress for this lesson will be deleted.`,
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/courses/lessons/${lessonId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        pushToast(json.error ?? "Could not delete lesson.", "error");
        return;
      }
      pushToast("Lesson deleted.", "success");
      await onRefresh();
    } catch {
      pushToast("Network error.", "error");
    }
  }

  async function nudgeSort(
    kind: "module" | "lesson",
    id: string,
    direction: -1 | 1,
    current: number,
  ) {
    const next = Math.max(0, current + direction);
    const url =
      kind === "module"
        ? `/api/admin/courses/modules/${id}`
        : `/api/admin/courses/lessons/${id}`;
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sort_order: next }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        pushToast(json.error ?? "Could not reorder.", "error");
        return;
      }
      await onRefresh();
    } catch {
      pushToast("Network error.", "error");
    }
  }

  if (loading) {
    return <p className={styles.muted}>Loading curriculum…</p>;
  }

  return (
    <div className={styles.panel}>
      {error ? <p className={styles.error}>{error}</p> : null}

      <form className={styles.card} onSubmit={createModule}>
        <h2 className={styles.moduleTitle}>Add module</h2>
        <div className={styles.inlineGrid}>
          <TitleField
            label="Module title"
            value={newModuleTitle}
            onChange={setNewModuleTitle}
          />
        </div>
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={creatingModule || !newModuleTitle.trim()}
        >
          {creatingModule ? "Creating…" : "Create module"}
        </button>
      </form>

      {modules.length === 0 ? (
        <div className={styles.empty}>
          No modules yet. Create your first module above.
        </div>
      ) : null}

      {modules.map((mod) => (
        <article key={mod.id} className={styles.card}>
          <ModuleCardHead mod={mod} />
          <RowActions
            onEdit={() => startEditModule(mod)}
            onDelete={() => void deleteModule(mod)}
            onUp={() => void nudgeSort("module", mod.id, -1, mod.sort_order)}
            onDown={() => void nudgeSort("module", mod.id, 1, mod.sort_order)}
            onAddLesson={() => openLessonDraft(mod.id)}
          />
          <div className={styles.lessonList}>
            {mod.lessons.length === 0 ? (
              <p className={styles.muted}>No lessons in this module.</p>
            ) : null}
            {mod.lessons.map((lesson) => (
              <div key={lesson.id} className={styles.lessonItem}>
                <div>
                  <strong>{lesson.title}</strong>
                  <div className={styles.lessonMeta}>
                    Bunny: {lesson.bunny_ref} · Order: {lesson.sort_order}
                  </div>
                  <span
                    className={`${styles.badge} ${
                      lesson.is_published ? styles.badgePublished : styles.badgeDraft
                    }`}
                  >
                    {lesson.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <RowActions
                  compact
                  onEdit={() => startEditLesson(mod, lesson.id)}
                  onDelete={() => void deleteLesson(lesson.id, lesson.title)}
                  onUp={() =>
                    void nudgeSort("lesson", lesson.id, -1, lesson.sort_order)
                  }
                  onDown={() =>
                    void nudgeSort("lesson", lesson.id, 1, lesson.sort_order)
                  }
                />
              </div>
            ))}
          </div>
        </article>
      ))}

      {editingModuleId ? (
        <Modal title="Edit module" onClose={() => setEditingModuleId(null)}>
          <form onSubmit={saveModule}>
            <ModuleFields form={moduleForm} setForm={setModuleForm} />
            <ModalActions onCancel={() => setEditingModuleId(null)} />
          </form>
        </Modal>
      ) : null}

      {lessonDraftModuleId ? (
        <Modal title="Add lesson" onClose={() => setLessonDraftModuleId(null)}>
          <form onSubmit={createLesson}>
            <LessonFields form={lessonForm} setForm={setLessonForm} />
            <ModalActions onCancel={() => setLessonDraftModuleId(null)} />
          </form>
        </Modal>
      ) : null}

      {editingLessonId ? (
        <Modal title="Edit lesson" onClose={() => setEditingLessonId(null)}>
          <form onSubmit={saveLesson}>
            <LessonFields form={lessonEditForm} setForm={setLessonEditForm} />
            <ModalActions onCancel={() => setEditingLessonId(null)} />
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function TitleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} required />
    </div>
  );
}

function ModuleCardHead({ mod }: { mod: ModuleWithLessonsDto }) {
  return (
    <CardHead
      title={mod.title}
      published={mod.is_published}
      meta={`Order ${mod.sort_order} · ${mod.lessons.length} lesson(s)`}
    />
  );
}

function CardHead({
  title,
  published,
  meta,
}: {
  title: string;
  published: boolean;
  meta: string;
}) {
  return (
    <div className={styles.cardHead}>
      <div>
        <h2 className={styles.moduleTitle}>{title}</h2>
        <p className={styles.muted}>{meta}</p>
      </div>
      <span
        className={`${styles.badge} ${
          published ? styles.badgePublished : styles.badgeDraft
        }`}
      >
        {published ? "Published" : "Draft"}
      </span>
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
  onUp,
  onDown,
  onAddLesson,
  compact,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onUp: () => void;
  onDown: () => void;
  onAddLesson?: () => void;
  compact?: boolean;
}) {
  return (
    <div className={styles.rowActions}>
      {onAddLesson ? (
        <button type="button" className={styles.btnGhost} onClick={onAddLesson}>
          + Lesson
        </button>
      ) : null}
      <button type="button" className={styles.btnGhost} onClick={onUp} aria-label="Move up">
        ↑
      </button>
      <button type="button" className={styles.btnGhost} onClick={onDown} aria-label="Move down">
        ↓
      </button>
      <button type="button" className={styles.btn} onClick={onEdit}>
        Edit
      </button>
      <button type="button" className={styles.btnDanger} onClick={onDelete}>
        Delete
      </button>
      {compact ? null : null}
    </div>
  );
}

function ModuleFields({
  form,
  setForm,
}: {
  form: {
    title: string;
    description: string;
    sort_order: number;
    is_published: boolean;
  };
  setForm: (f: typeof form) => void;
}) {
  return (
    <>
      <div className={styles.field}>
        <label htmlFor="mod-title">Title</label>
        <input
          id="mod-title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="mod-desc">Description</label>
        <textarea
          id="mod-desc"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className={styles.inlineGrid}>
        <div className={styles.field}>
          <label htmlFor="mod-sort">Sort order</label>
          <input
            id="mod-sort"
            type="number"
            value={form.sort_order}
            onChange={(e) =>
              setForm({ ...form, sort_order: Number(e.target.value) || 0 })
            }
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="mod-pub">Published</label>
          <select
            id="mod-pub"
            value={form.is_published ? "1" : "0"}
            onChange={(e) =>
              setForm({ ...form, is_published: e.target.value === "1" })
            }
          >
            <option value="0">Draft</option>
            <option value="1">Published</option>
          </select>
        </div>
      </div>
    </>
  );
}

function LessonFields({
  form,
  setForm,
}: {
  form: {
    title: string;
    description: string;
    bunny_input: string;
    sort_order: number;
    is_published: boolean;
  };
  setForm: (f: typeof form) => void;
}) {
  return (
    <>
      <div className={styles.field}>
        <label htmlFor="les-title">Title</label>
        <input
          id="les-title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="les-desc">Description</label>
        <textarea
          id="les-desc"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="les-bunny">Bunny embed URL or iframe</label>
        <textarea
          id="les-bunny"
          value={form.bunny_input}
          onChange={(e) => setForm({ ...form, bunny_input: e.target.value })}
          required
          placeholder="https://iframe.mediadelivery.net/embed/… or &lt;iframe src=…&gt;"
        />
      </div>
      <div className={styles.inlineGrid}>
        <div className={styles.field}>
          <label htmlFor="les-sort">Sort order</label>
          <input
            id="les-sort"
            type="number"
            value={form.sort_order}
            onChange={(e) =>
              setForm({ ...form, sort_order: Number(e.target.value) || 0 })
            }
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="les-pub">Published</label>
          <select
            id="les-pub"
            value={form.is_published ? "1" : "0"}
            onChange={(e) =>
              setForm({ ...form, is_published: e.target.value === "1" })
            }
          >
            <option value="0">Draft</option>
            <option value="1">Published</option>
          </select>
        </div>
      </div>
    </>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <ModalPanel
        title={title}
        onClose={onClose}
        onBackdropClick={(e) => e.stopPropagation()}
      >
        {children}
      </ModalPanel>
    </div>
  );
}

function ModalPanel({
  title,
  onClose,
  onBackdropClick,
  children,
}: {
  title: string;
  onClose: () => void;
  onBackdropClick: (e: MouseEvent) => void;
  children: ReactNode;
}) {
  return (
    <div
      className={styles.modal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-courses-modal-title"
      onClick={onBackdropClick}
    >
      <h2 id="admin-courses-modal-title">{title}</h2>
      {children}
      <button type="button" className={styles.btnGhost} onClick={onClose}>
        Close
      </button>
    </div>
  );
}

function ModalActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className={styles.modalActions}>
      <button type="button" className={styles.btn} onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className={styles.btnPrimary}>
        Save
      </button>
    </div>
  );
}