"use client";

import {
  FormEvent,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { AdminStudentDto } from "@/lib/portal/adminSerialize";
import { formatCreatedAtPkt } from "@/lib/formatPktTime";
import styles from "./admin-courses.module.css";

type ToastFn = (message: string, tone: "success" | "error") => void;

const emptyAddForm = {
  display_name: "",
  email: "",
  phone: "",
  password: "",
  is_active: true,
};

export function StudentsTab({
  students,
  loading,
  error,
  search,
  onSearchChange,
  onRefresh,
  pushToast,
}: {
  students: AdminStudentDto[];
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => Promise<void>;
  pushToast: ToastFn;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [adding, setAdding] = useState(false);

  const [editStudent, setEditStudent] = useState<AdminStudentDto | null>(null);
  const [editForm, setEditForm] = useState({
    display_name: "",
    email: "",
    phone: "",
    password: "",
    is_active: true,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const hay = [
        s.display_name ?? "",
        s.email ?? "",
        s.phone_e164 ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [students, search]);

  async function submitAdd(e: FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/admin/courses/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          display_name: addForm.display_name || null,
          email: addForm.email || null,
          phone: addForm.phone || null,
          password: addForm.password,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        pushToast(json.error ?? "Could not add student.", "error");
        return;
      }
      setAddOpen(false);
      setAddForm(emptyAddForm);
      pushToast("Student created.", "success");
      await onRefresh();
    } catch {
      pushToast("Network error.", "error");
    } finally {
      setAdding(false);
    }
  }

  function openEdit(s: AdminStudentDto) {
    setEditStudent(s);
    setEditForm({
      display_name: s.display_name ?? "",
      email: s.email ?? "",
      phone: s.phone_e164 ?? "",
      password: "",
      is_active: s.is_active,
    });
  }

  async function submitEdit(e: FormEvent) {
    e.preventDefault();
    if (!editStudent) return;
    try {
      const body: Record<string, unknown> = {
        display_name: editForm.display_name || null,
        email: editForm.email || null,
        phone: editForm.phone || null,
        is_active: editForm.is_active,
      };
      if (editForm.password.trim()) body.password = editForm.password;

      const res = await fetch(
        `/api/admin/courses/students/${editStudent.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        },
      );
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        pushToast(json.error ?? "Could not update student.", "error");
        return;
      }
      setEditStudent(null);
      pushToast("Student updated.", "success");
      await onRefresh();
    } catch {
      pushToast("Network error.", "error");
    }
  }

  if (loading) {
    return <p className={styles.muted}>Loading students…</p>;
  }

  return (
    <div className={styles.panel}>
      {error ? <p className={styles.error}>{error}</p> : null}

      <StudentsToolbar
        search={search}
        onSearchChange={onSearchChange}
        onAdd={() => setAddOpen(true)}
      />

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          {students.length === 0
            ? "No students yet. Add a student to enable portal login."
            : "No students match your search."}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Status</th>
                <th scope="col">Created</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{s.display_name?.trim() || "—"}</td>
                  <td>{s.email ?? "—"}</td>
                  <td>{s.phone_e164 ?? "—"}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        s.is_active ? styles.badgeActive : styles.badgeInactive
                      }`}
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{formatCreatedAtPkt(s.created_at)}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.btn}
                      onClick={() => openEdit(s)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {addOpen ? (
        <StudentModal title="Add student" onClose={() => setAddOpen(false)}>
          <form onSubmit={submitAdd}>
            <StudentFormFields form={addForm} setForm={setAddForm} showPassword />
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btn}
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={adding}
              >
                {adding ? "Saving…" : "Create student"}
              </button>
            </div>
          </form>
        </StudentModal>
      ) : null}

      {editStudent ? (
        <StudentModal title="Edit student" onClose={() => setEditStudent(null)}>
          <form onSubmit={submitEdit}>
            <StudentFormFields
              form={editForm}
              setForm={setEditForm}
              showPasswordOptional
            />
            <div className={styles.field}>
              <label htmlFor="stu-active">Account status</label>
              <select
                id="stu-active"
                value={editForm.is_active ? "1" : "0"}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    is_active: e.target.value === "1",
                  })
                }
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btn}
                onClick={() => setEditStudent(null)}
              >
                Cancel
              </button>
              <button type="submit" className={styles.btnPrimary}>
                Save changes
              </button>
            </div>
          </form>
        </StudentModal>
      ) : null}
    </div>
  );
}

function StudentsToolbar({
  search,
  onSearchChange,
  onAdd,
}: {
  search: string;
  onSearchChange: (q: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className={styles.toolbar} style={{ marginBottom: "0.75rem" }}>
      <div className={styles.field} style={{ flex: 1, marginBottom: 0 }}>
        <label htmlFor="student-search">Search students</label>
        <input
          id="student-search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Name, email, or phone"
        />
      </div>
      <button type="button" className={styles.btnPrimary} onClick={onAdd}>
        Add student
      </button>
    </div>
  );
}

function StudentModal({
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
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="student-modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

type StudentFormState = {
  display_name: string;
  email: string;
  phone: string;
  password: string;
  is_active: boolean;
};

function StudentFormFields({
  form,
  setForm,
  showPassword,
  showPasswordOptional,
}: {
  form: StudentFormState;
  setForm: Dispatch<SetStateAction<StudentFormState>>;
  showPassword?: boolean;
  showPasswordOptional?: boolean;
}) {
  return (
    <>
      <div className={styles.field}>
        <label htmlFor="stu-name">Display name</label>
        <input
          id="stu-name"
          value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="stu-email">Email</label>
        <input
          id="stu-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          autoComplete="off"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="stu-phone">Phone</label>
        <input
          id="stu-phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="03xx or +92…"
        />
      </div>
      {showPassword ? (
        <div className={styles.field}>
          <label htmlFor="stu-pass">Password</label>
          <input
            id="stu-pass"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete="new-password"
          />
        </div>
      ) : null}
      {showPasswordOptional ? (
        <div className={styles.field}>
          <label htmlFor="stu-pass-new">New password (optional)</label>
          <input
            id="stu-pass-new"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
          />
        </div>
      ) : null}
      <p className={styles.muted}>At least one of email or phone is required.</p>
    </>
  );
}