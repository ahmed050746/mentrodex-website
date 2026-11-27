type Bucket = { count: number; resetAt: number };

const scopes = new Map<string, Map<string, Bucket>>();

const DEFAULT_WINDOW_MS = 60_000;

function scopeBuckets(scope: string): Map<string, Bucket> {
  let buckets = scopes.get(scope);
  if (!buckets) {
    buckets = new Map();
    scopes.set(scope, buckets);
  }
  return buckets;
}

export function checkScopedRateLimit(
  scope: string,
  key: string,
  maxAttempts: number,
  windowMs: number = DEFAULT_WINDOW_MS,
): boolean {
  const now = Date.now();
  const buckets = scopeBuckets(scope);
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= maxAttempts) return false;
  bucket.count += 1;
  return true;
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

const PORTAL_LOGIN_MAX = 8;
const ADMIN_ORDERS_LOGIN_MAX = 8;
const ENROLL_STUB_MAX = 6;

export function checkPortalLoginRateLimit(key: string): boolean {
  return checkScopedRateLimit("portal-login", key, PORTAL_LOGIN_MAX);
}

export function checkAdminOrdersLoginRateLimit(ip: string): boolean {
  return checkScopedRateLimit(
    "admin-orders-login",
    `ip:${ip}`,
    ADMIN_ORDERS_LOGIN_MAX,
  );
}

export function checkEnrollStubRateLimit(ip: string): boolean {
  return checkScopedRateLimit("enroll-stub", `ip:${ip}`, ENROLL_STUB_MAX);
}