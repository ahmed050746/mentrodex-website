"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./portal.module.css";

export function PortalLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      await fetch("/api/portal/logout", { method: "POST", credentials: "include" });
      router.push("/portal");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={styles.btnGhost}
      onClick={() => void onLogout()}
      disabled={loading}
    >
      {loading ? "Signing out…" : "Log out"}
    </button>
  );
}