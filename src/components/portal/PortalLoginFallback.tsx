import Link from "next/link";
import styles from "./portal.module.css";

/** Shown while the client-only login UI loads — no `<form>` to avoid native submit. */
export function PortalLoginFallback() {
  return (
    <div className={styles.portalPage}>
      <Link className={styles.backLink} href="/" aria-label="Back to home">
        ← Back
      </Link>
      <p className={styles.brand} aria-label="Mentrodex">
        Mentrodex
      </p>
      <p className={styles.brandSub}>Student portal</p>
      <div className={styles.card}>
        <h1>Sign in</h1>
        <p className={styles.muted}>Loading sign-in…</p>
      </div>
    </div>
  );
}