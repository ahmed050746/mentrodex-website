"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { PortalLoginFallback } from "./PortalLoginFallback";
import styles from "./portal.module.css";

type LoginResponse = {
  ok?: boolean;
  error?: string;
  redirectTo?: string;
};

function safeRedirectPath(path: unknown): string | null {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    return null;
  }
  return path;
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function PortalLoginClient() {
  const mounted = useIsClient();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef(false);

  async function attemptLogin() {
    if (inFlightRef.current) return;

    const id = identifier.trim();
    const pw = password;
    if (!id || !pw) {
      setError("Enter your email or phone and password.");
      setStatusLine("Ready — enter email/phone and password.");
      return;
    }

    inFlightRef.current = true;
    setError(null);
    setStatusLine("Submitting… calling POST /api/portal/login");
    setLoading(true);

    let navigating = false;
    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: id, password: pw }),
      });

      let json: LoginResponse;
      try {
        json = (await res.json()) as LoginResponse;
      } catch {
        const msg = res.ok
          ? "Sign in failed — server returned invalid JSON."
          : `Sign in failed (HTTP ${res.status}).`;
        setError(msg);
        setStatusLine(`API status: ${res.status} — invalid JSON body`);
        return;
      }

      if (!res.ok) {
        const msg = json.error ?? `Sign in failed (HTTP ${res.status}).`;
        setError(msg);
        setStatusLine(`API status: ${res.status} — ${msg}`);
        return;
      }

      if (json.ok !== true) {
        const msg = json.error ?? "Sign in failed — unexpected server response.";
        setError(msg);
        setStatusLine(`API status: ${res.status} — ok was not true`);
        return;
      }

      const dest = safeRedirectPath(json.redirectTo);
      if (!dest) {
        const msg = "Sign-in succeeded but the server did not return a redirect URL.";
        setError(msg);
        setStatusLine(`API status: ${res.status} — missing redirectTo`);
        return;
      }

      setStatusLine(`API status: ${res.status} — redirecting to ${dest}`);
      navigating = true;
      if (dest === window.location.pathname) {
        window.location.reload();
      } else {
        window.location.replace(dest);
      }
      return;
    } catch {
      const msg = "Network error. Check your connection and try again.";
      setError(msg);
      setStatusLine(msg);
    } finally {
      inFlightRef.current = false;
      if (!navigating) {
        setLoading(false);
      }
    }
  }

  if (!mounted) {
    return <PortalLoginFallback />;
  }

  function onEnterKey(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    void attemptLogin();
  }

  return (
    <div className={styles.portalPage}>
      <p className={styles.brand} aria-label="Mentrodex">
        Mentrodex
      </p>
      <p className={styles.brandSub}>Student portal</p>
      <div className={styles.card}>
        <h1 id="portal-signin-heading">Sign in</h1>
        <p className={styles.muted}>Use the email or phone number on your enrollment.</p>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <div role="form" aria-labelledby="portal-signin-heading" onKeyDown={onEnterKey}>
          <div className={styles.field}>
            <label htmlFor="portal-id">Email or phone number</label>
            <input
              id="portal-id"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="portal-pw">Password</label>
            <input
              id="portal-pw"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={loading}
            onClick={() => void attemptLogin()}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          {statusLine ? (
            <p className={styles.statusLine} role="status" aria-live="polite">
              {statusLine}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}