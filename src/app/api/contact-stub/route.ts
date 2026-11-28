import {
  checkContactStubRateLimit,
  clientIpFromRequest,
} from "@/lib/rateLimit";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import {
  createServiceRoleClient,
  SupabaseConfigError,
} from "@/lib/supabase/serviceRole";
import { NextResponse } from "next/server";

type ContactBody = {
  name?: string;
  phone?: string;
  email?: string | null;
  quiz_answers?: Record<string, string>;
};

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured in .env.local" },
      { status: 503 },
    );
  }

  const ip = clientIpFromRequest(request);
  if (!checkContactStubRateLimit(ip)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many submissions. Try again in a minute.",
      },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as ContactBody;
  const name = body.name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";

  if (!name || !phone) {
    return NextResponse.json(
      { ok: false, error: "Name and phone are required." },
      { status: 400 },
    );
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    const message =
      e instanceof SupabaseConfigError
        ? e.message
        : "Server database client is not configured.";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: "Add SUPABASE_SERVICE_ROLE_KEY in Vercel / .env.local (server-only).",
      },
      { status: 503 },
    );
  }

  try {
    const { data, error } = await supabase
      .from("contact_leads")
      .insert({
        name,
        phone,
        email: body.email?.trim() || null,
        quiz_answers: body.quiz_answers ?? {},
      })
      .select("id")
      .single();

    if (error) {
      console.error("[contact-stub] Supabase error:", error.message);
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          hint: "Run migrations 001 and 014; ensure SUPABASE_SERVICE_ROLE_KEY is set on the server.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, stored: true, id: data.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}