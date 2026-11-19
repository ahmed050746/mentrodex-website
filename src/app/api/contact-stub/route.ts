import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseConfig } from "@/lib/supabase/env";
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

  const body = (await request.json().catch(() => ({}))) as ContactBody;
  const name = body.name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";

  if (!name || !phone) {
    return NextResponse.json(
      { ok: false, error: "Name and phone are required." },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();
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
          hint: "Run supabase/migrations/001_initial.sql and 002_rls_insert_policies.sql in Supabase SQL editor.",
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