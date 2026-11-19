import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Supabase env not configured. Add URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or ANON_KEY) to .env.local.",
      },
      { status: 503 },
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("orders").select("id").limit(1);

    if (error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("does not exist") ||
        message.includes("relation") ||
        error.code === "PGRST205"
      ) {
        return NextResponse.json({
          ok: true,
          supabase: "connected",
          note: "orders table not found yet — run supabase/migrations/003_orders.sql",
        });
      }
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, supabase: "connected" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}