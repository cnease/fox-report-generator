import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, role, must_change_password, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ technicians: data || [] });
  } catch (error) {
    console.error("List technicians error:", error);

    return NextResponse.json(
      { error: "Failed to load technicians." },
      { status: 500 }
    );
  }
}