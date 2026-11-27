import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./env";

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

/** Server-only admin client — requires `SUPABASE_SERVICE_ROLE_KEY`. */
export function createServiceRoleClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url) {
    throw new SupabaseConfigError(
      "Missing NEXT_PUBLIC_SUPABASE_URL in .env.local",
    );
  }
  if (!serviceKey) {
    throw new SupabaseConfigError(
      "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local (Supabase → Settings → API → service_role)",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}