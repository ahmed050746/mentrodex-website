"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { AdminOrderRow } from "@/lib/adminOrdersTypes";
import { adminOrderScreenshotSrc } from "@/lib/paymentScreenshots";
import styles from "./admin-orders.module.css";

function isPurchase(eventName: string): boolean {
  return eventName.trim().toLowerCase() === "purchase";
}

function isRejected(eventName: string): boolean {
  return eventName.trim().toLowerCase() === "rejected";
}

function isPending(eventName: string): boolean {
  return !isPurchase(eventName) && !isRejected(eventName);
}

function matchesSearch(order: AdminOrderRow, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    order.order_id.toLowerCase().includes(needle) ||
    (order.email?.toLowerCase().includes(needle) ?? false)
  );
}

function pktDateKey(order: AdminOrderRow): string {
  const d = new Date(order.created_at);
  if (Number.isNaN(d.getTime())) return order.created_at_pkt.split(",")[0] ?? "Unknown";
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "medium",
  }).format(d);
}

function pktTimeOnly(order: AdminOrderRow): string {
  const d = new Date(order.created_at);
  if (Number.isNaN(d.getTime())) {
    const part = order.created_at_pkt.split(",")[1];
    return part?.trim() ?? order.created_at_pkt;
  }
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    timeStyle: "short",
  }).format(d);
}

function groupOrdersByPktDate(orders: AdminOrderRow[]): [string, AdminOrderRow[]][] {
  const map = new Map<string, AdminOrderRow[]>();
  for (const order of orders) {
    const key = pktDateKey(order);
    const list = map.get(key);
    if (list) list.push(order);
    else map.set(key, [order]);
  }
  return [...map.entries()];
}

export function AdminOrdersClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [purchaseSectionOpen, setPurchaseSectionOpen] = useState(false);
  const [rejectedSectionOpen, setRejectedSectionOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/admin/orders", { credentials: "include" });
      if (res.status === 401) {
        setAuthed(false);
        setOrders([]);
        return;
      }
      const json = (await res.json()) as {
        ok?: boolean;
        orders?: AdminOrderRow[];
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setFetchError(json.error ?? "Could not load orders.");
        return;
      }
      setAuthed(true);
      setOrders(json.orders ?? []);
    } catch {
      setFetchError("Network error while loading orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!previewUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewUrl(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewUrl]);

  const q = search.trim();

  const pendingOrders = useMemo(
    () =>
      orders.filter((o) => isPending(o.event_name)).filter((o) => matchesSearch(o, q)),
    [orders, q],
  );

  const approvedOrders = useMemo(
    () =>
      orders.filter((o) => isPurchase(o.event_name)).filter((o) => matchesSearch(o, q)),
    [orders, q],
  );

  const rejectedOrders = useMemo(
    () =>
      orders.filter((o) => isRejected(o.event_name)).filter((o) => matchesSearch(o, q)),
    [orders, q],
  );

  const approvedByDate = useMemo(
    () => groupOrdersByPktDate(approvedOrders),
    [approvedOrders],
  );

  const rejectedByDate = useMemo(
    () => groupOrdersByPktDate(rejectedOrders),
    [rejectedOrders],
  );

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
      await loadOrders();
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
    setOrders([]);
  }

  async function patchOrder(
    order: AdminOrderRow,
    action: "approve" | "reject",
  ) {
    if (!isPending(order.event_name)) return;

    const message =
      action === "approve"
        ? `Approve order ${order.order_id} and send Meta Purchase CAPI?`
        : `Reject order ${order.order_id}? It will move to the rejected list.`;

    if (!window.confirm(message)) return;

    setActionOrderId(order.order_id);
    const nextEvent = action === "approve" ? "Purchase" : "Rejected";
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ order_id: order.order_id, action }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        order?: AdminOrderRow;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        window.alert(json.error ?? `${action === "approve" ? "Approve" : "Reject"} failed.`);
        return;
      }
      const next = json.order ?? { ...order, event_name: nextEvent };
      setOrders((prev) =>
        prev.map((row) =>
          row.order_id === order.order_id
            ? { ...row, ...next, event_name: nextEvent }
            : row,
        ),
      );
    } catch {
      window.alert(
        action === "approve"
          ? "Network error while approving."
          : "Network error while rejecting.",
      );
    } finally {
      setActionOrderId(null);
    }
  }

  if (authed === null && loading) {
    return (
      <div className={styles.wrap}>
        <p className={styles.loading}>Loading…</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className={styles.wrap}>
        <form className={styles.loginCard} onSubmit={onLogin}>
          <h1>Admin — Orders</h1>
          {loginError ? <p className={styles.error}>{loginError}</p> : null}
          <div className={styles.field}>
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loginLoading}
          >
            {loginLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Orders</h1>
          <p className={styles.subtitle}>
            Pending: {pendingOrders.length} · Purchase sent:{" "}
            {approvedOrders.length} · Rejected: {rejectedOrders.length}
          </p>
        </div>
        <button
          type="button"
          className={styles.btnGhost}
          onClick={() => void onLogout()}
        >
          Log out
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchRow}>
          <input
            type="search"
            placeholder="Search order ID or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search orders"
          />
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => void loadOrders()}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {fetchError ? (
        <p className={styles.error}>
          {fetchError}
          {fetchError.includes("NEXT_PUBLIC_SUPABASE") ||
          fetchError.includes("SERVICE_ROLE") ? (
            <>
              <br />
              <span style={{ fontWeight: 400 }}>
                Add Supabase keys to <code>.env.local</code>, then restart{" "}
                <code>npm run dev</code>.
              </span>
            </>
          ) : null}
        </p>
      ) : null}

      {!fetchError ? (
        <div className={styles.main}>
          <section aria-labelledby="pending-heading">
            <h2 id="pending-heading" className={styles.sectionTitle}>
              Pending verification ({pendingOrders.length})
            </h2>
            {pendingOrders.length === 0 ? (
              <p className={styles.empty}>No pending orders.</p>
            ) : (
              <div className={styles.pendingList}>
                {pendingOrders.map((order) => {
                  const customerName = [order.first_name, order.last_name]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <article key={order.id} className={styles.pendingCard}>
                      <div className={styles.pendingInfo}>
                        <span className={styles.badgePending}>Pending</span>
                        <div className={styles.orderId}>{order.order_id}</div>
                        <span className={styles.timeLine}>
                          {order.created_at_pkt}
                        </span>
                        <p className={styles.meta}>
                          <strong>{customerName || "—"}</strong>
                          <br />
                          {order.email ?? "—"}
                          <br />
                          {order.phone_number ?? "—"}
                          {order.city ? (
                            <>
                              <br />
                              {order.city}
                              {order.country ? `, ${order.country}` : ""}
                            </>
                          ) : null}
                        </p>
                        <p className={styles.amount}>
                          {order.currency} {order.value.toLocaleString()}
                        </p>
                        <div className={styles.actionRow}>
                          <button
                            type="button"
                            className={styles.btnApprove}
                            disabled={actionOrderId === order.order_id}
                            onClick={() => void patchOrder(order, "approve")}
                          >
                            {actionOrderId === order.order_id
                              ? "Working…"
                              : "Approve & send Purchase"}
                          </button>
                          <button
                            type="button"
                            className={styles.btnReject}
                            disabled={actionOrderId === order.order_id}
                            onClick={() => void patchOrder(order, "reject")}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      <div className={styles.pendingMedia}>
                        {order.image_upload ? (
                          <button
                            type="button"
                            className={styles.receiptBtn}
                            onClick={() =>
                              setPreviewUrl(adminOrderScreenshotSrc(order.order_id))
                            }
                            aria-label="View payment screenshot"
                          >
                            <img
                              src={adminOrderScreenshotSrc(order.order_id)}
                              alt="Payment screenshot"
                              className={styles.receiptImg}
                              loading="lazy"
                            />
                          </button>
                        ) : (
                          <div className={styles.receiptPlaceholder}>
                            No screenshot
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {rejectedOrders.length > 0 ? (
            <section className={styles.toggleSection}>
              <button
                type="button"
                className={styles.toggleHeader}
                aria-expanded={rejectedSectionOpen}
                onClick={() => setRejectedSectionOpen((o) => !o)}
              >
                <span>Rejected ({rejectedOrders.length})</span>
                <span className={styles.toggleChevron} aria-hidden>
                  {rejectedSectionOpen ? "▾" : "▸"}
                </span>
              </button>
              {rejectedSectionOpen ? (
                <div className={styles.toggleBody}>
                  {rejectedByDate.map(([dateLabel, dayOrders]) => (
                    <div key={dateLabel}>
                      <h3 className={styles.dateGroupTitle}>{dateLabel}</h3>
                      <div className={styles.approvedList}>
                        {dayOrders.map((order) => {
                          const customerName = [
                            order.first_name,
                            order.last_name,
                          ]
                            .filter(Boolean)
                            .join(" ");
                          return (
                            <div
                              key={order.id}
                              className={styles.approvedRow}
                            >
                              <span className={styles.approvedTime}>
                                {pktTimeOnly(order)}
                              </span>
                              <div className={styles.approvedMain}>
                                <div className={styles.approvedName}>
                                  {customerName || "—"}
                                </div>
                                <div className={styles.approvedSub}>
                                  {order.order_id}
                                  {order.email ? ` · ${order.email}` : ""}
                                </div>
                              </div>
                              {order.image_upload ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewUrl(
                                      adminOrderScreenshotSrc(order.order_id),
                                    )
                                  }
                                  aria-label="View receipt"
                                >
                                  <img
                                    src={adminOrderScreenshotSrc(order.order_id)}
                                    alt=""
                                    className={styles.approvedThumb}
                                  />
                                </button>
                              ) : (
                                <span className={styles.badgeRejected}>✕</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {approvedOrders.length > 0 ? (
            <section className={styles.toggleSection}>
              <button
                type="button"
                className={styles.toggleHeader}
                aria-expanded={purchaseSectionOpen}
                onClick={() => setPurchaseSectionOpen((o) => !o)}
              >
                <span>Purchase sent ({approvedOrders.length})</span>
                <span className={styles.toggleChevron} aria-hidden>
                  {purchaseSectionOpen ? "▾" : "▸"}
                </span>
              </button>
              {purchaseSectionOpen ? (
                <div className={styles.toggleBody}>
                  {approvedByDate.map(([dateLabel, dayOrders]) => (
                    <div key={dateLabel}>
                      <h3 className={styles.dateGroupTitle}>{dateLabel}</h3>
                      <div className={styles.approvedList}>
                        {dayOrders.map((order) => {
                          const customerName = [
                            order.first_name,
                            order.last_name,
                          ]
                            .filter(Boolean)
                            .join(" ");
                          return (
                            <div
                              key={order.id}
                              className={styles.approvedRow}
                            >
                              <span className={styles.approvedTime}>
                                {pktTimeOnly(order)}
                              </span>
                              <div className={styles.approvedMain}>
                                <div className={styles.approvedName}>
                                  {customerName || "—"}
                                </div>
                                <div className={styles.approvedSub}>
                                  {order.order_id}
                                  {order.email ? ` · ${order.email}` : ""}
                                </div>
                              </div>
                              {order.image_upload ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewUrl(
                                      adminOrderScreenshotSrc(order.order_id),
                                    )
                                  }
                                  aria-label="View receipt"
                                >
                                  <img
                                    src={adminOrderScreenshotSrc(order.order_id)}
                                    alt=""
                                    className={styles.approvedThumb}
                                  />
                                </button>
                              ) : (
                                <span className={styles.badgePurchase}>✓</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}

      {previewUrl ? (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Payment screenshot preview"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className={styles.lightboxInner}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.lightboxClose}
              aria-label="Close preview"
              onClick={() => setPreviewUrl(null)}
            >
              ×
            </button>
            <img
              src={previewUrl}
              alt="Payment screenshot full size"
              className={styles.lightboxImg}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}