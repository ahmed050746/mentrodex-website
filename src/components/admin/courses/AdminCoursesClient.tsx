"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { AdminStudentDto, ModuleWithLessonsDto } from "@/lib/portal/adminSerialize";
import { CurriculumTab } from "./CurriculumTab";
import { StudentsTab } from "./StudentsTab";
import { ToastHost } from "./ToastHost";
import { useAdminToast } from "./useAdminToast";
import styles from "./admin-courses.module.css";

type TabId = "curriculum" | "students";

export function AdminCoursesClient() {
  const { toasts, pushToast, dismissToast } = useAdminToast();

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [tab, setTab] = useState<TabId>("curriculum");

  const [modules, setModules] = useState<ModuleWithLessonsDto[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState<string | null>(null);

  const [students, setStudents] = useState<AdminStudentDto[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  const loadModules = useCallback(async () => {
    setModulesLoading(true);
    setModulesError(null);
    try {
      const res = await fetch("/api/admin/courses/modules", {
        credentials: "include",
      });
      if (res.status === 401) {
        setAuthed(false);
        setModules([]);
        return;
      }
      const json = (await res.json()) as {
        ok?: boolean;
        modules?: ModuleWithLessonsDto[];
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setModulesError(json.error ?? "Could not load curriculum.");
        return;
      }
      setAuthed(true);
      setModules(json.modules ?? []);
    } catch {
      setModulesError("Network error while loading curriculum.");
    } finally {
      setModulesLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async (q?: string) => {
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      const params = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
      const res = await fetch(`/api/admin/courses/students${params}`, {
        credentials: "include",
      });
      if (res.status === 401) {
        setAuthed(false);
        setStudents([]);
        return;
      }
      const json = (await res.json()) as {
        ok?: boolean;
        students?: AdminStudentDto[];
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setStudentsError(json.error ?? "Could not load students.");
        return;
      }
      setAuthed(true);
      setStudents(json.students ?? []);
    } catch {
      setStudentsError("Network error while loading students.");
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadModules();
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadModules]);

  useEffect(() => {
    if (tab !== "students" || authed !== true) return;
    const t = window.setTimeout(() => {
      void loadStudents(studentSearch);
    }, 250);
    return () => window.clearTimeout(t);
  }, [tab, authed, studentSearch, loadStudents]);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/orders/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setLoginError(json.error ?? "Login failed.");
        return;
      }
      setPassword("");
      setAuthed(true);
      await loadModules();
      if (tab === "students") await loadStudents(studentSearch);
    } catch {
      setLoginError("Network error.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function onLogout() {
    await fetch("/api/admin/orders/login", {
      method: "DELETE",
      credentials: "include",
    });
    setAuthed(false);
    setModules([]);
    setStudents([]);
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <Wordmark />
        <div>
          {authed ? (
            <div className={styles.rowActions}>
              <a className={styles.btnGhost} href="/admin/orders">
                Orders
              </a>
              <button type="button" className={styles.btn} onClick={() => void onLogout()}>
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {authed === false || authed === null ? (
        <LoginCard
          authed={authed}
          loginError={loginError}
          password={password}
          loginLoading={loginLoading}
          onPassword={setPassword}
          onLogin={onLogin}
        />
      ) : (
        <>
          <div className={styles.toolbar}>
            <div className={styles.tabs} role="tablist" aria-label="Course admin">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "curriculum"}
                className={tab === "curriculum" ? styles.tabActive : styles.tab}
                onClick={() => setTab("curriculum")}
              >
                Curriculum
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "students"}
                className={tab === "students" ? styles.tabActive : styles.tab}
                onClick={() => setTab("students")}
              >
                Students
              </button>
            </div>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() =>
                void (tab === "curriculum"
                  ? loadModules()
                  : loadStudents(studentSearch))
              }
            >
              Refresh
            </button>
          </div>

          {tab === "curriculum" ? (
            <CurriculumTab
              modules={modules}
              loading={modulesLoading}
              error={modulesError}
              onRefresh={loadModules}
              pushToast={pushToast}
            />
          ) : (
            <StudentsTab
              students={students}
              loading={studentsLoading}
              error={studentsError}
              search={studentSearch}
              onSearchChange={setStudentSearch}
              onRefresh={() => loadStudents(studentSearch)}
              pushToast={pushToast}
            />
          )}
        </>
      )}

      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function Wordmark() {
  return (
    <div>
      <p className={styles.brand} aria-label="Mentrodex">
        Mentrodex
      </p>
      <p className={styles.subtitle}>Course manager</p>
    </div>
  );
}

function LoginCard({
  authed,
  loginError,
  password,
  loginLoading,
  onPassword,
  onLogin,
}: {
  authed: boolean | null;
  loginError: string | null;
  password: string;
  loginLoading: boolean;
  onPassword: (v: string) => void;
  onLogin: (e: FormEvent) => void;
}) {
  return (
    <div className={styles.loginCard}>
      <h1>Admin sign in</h1>
      <p className={styles.muted}>
        Same password as Orders admin. {authed === null ? "Checking session…" : ""}
      </p>
      {loginError ? <p className={styles.error}>{loginError}</p> : null}
      <form onSubmit={onLogin}>
        <div className={styles.field}>
          <label htmlFor="admin-pw">Password</label>
          <input
            id="admin-pw"
            type="password"
            value={password}
            onChange={(e) => onPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={loginLoading || authed === null}
        >
          {loginLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}