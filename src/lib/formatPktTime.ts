const PKT = "Asia/Karachi";

/** Human-readable order time in Pakistan (falls back to raw ISO if invalid). */
export function formatCreatedAtPkt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: PKT,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}