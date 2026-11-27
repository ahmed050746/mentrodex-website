const ALLOWED_META_EVENTS = new Set([
  "PageView",
  "Lead",
  "InitiateCheckout",
]);

const MAX_EVENT_ID_LEN = 128;
const MAX_SOURCE_URL_LEN = 2048;
const MAX_CUSTOM_DATA_JSON = 4096;

function allowedHosts(): Set<string> {
  const hosts = new Set([
    "localhost:3000",
    "127.0.0.1:3000",
    "mentrodex.com",
    "www.mentrodex.com",
  ]);
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      hosts.add(new URL(site).host);
    } catch {
      /* ignore */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) hosts.add(vercel);
  return hosts;
}

function hostAllowed(host: string, allowed: Set<string>): boolean {
  if (allowed.has(host)) return true;
  if (process.env.VERCEL && host.endsWith(".vercel.app")) return true;
  return false;
}

export function isMetaCapiRequestAllowed(request: Request): boolean {
  const allowed = allowedHosts();

  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "same-origin" || secFetchSite === "same-site") {
    return true;
  }

  for (const header of ["origin", "referer"] as const) {
    const raw = request.headers.get(header);
    if (!raw) continue;
    try {
      const host = new URL(raw).host;
      if (hostAllowed(host, allowed)) return true;
    } catch {
      /* ignore */
    }
  }

  const host = request.headers.get("host")?.trim();
  if (host && allowed.has(host)) return true;

  return false;
}

export function validateMetaEventName(name: string): boolean {
  return ALLOWED_META_EVENTS.has(name);
}

export function validateMetaCapiPayload(body: {
  event_name?: string;
  event_id?: string;
  event_source_url?: string;
  custom_data?: Record<string, unknown>;
}): string | null {
  const eventName = body.event_name?.trim() ?? "";
  if (!validateMetaEventName(eventName)) {
    return "event_name is not allowed.";
  }

  const eventId = body.event_id?.trim() ?? "";
  if (!eventId || eventId.length > MAX_EVENT_ID_LEN) {
    return "event_id is invalid.";
  }

  const sourceUrl = body.event_source_url?.trim();
  if (sourceUrl) {
    if (sourceUrl.length > MAX_SOURCE_URL_LEN) {
      return "event_source_url is too long.";
    }
    try {
      const host = new URL(sourceUrl).host;
      if (!hostAllowed(host, allowedHosts())) {
        return "event_source_url is not allowed.";
      }
    } catch {
      return "event_source_url is invalid.";
    }
  }

  if (body.custom_data) {
    let encoded: string;
    try {
      encoded = JSON.stringify(body.custom_data);
    } catch {
      return "custom_data is invalid.";
    }
    if (encoded.length > MAX_CUSTOM_DATA_JSON) {
      return "custom_data is too large.";
    }
  }

  return null;
}