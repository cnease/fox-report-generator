import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from("reports")
      .select(`
        id,
        user_id,
        customer_name,
        service_address,
        pest_type,
        findings,
        treatment,
        generated_email,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (reportsError) {
      return NextResponse.json(
        { error: reportsError.message },
        { status: 500 }
      );
    }

    const userIds = [...new Set((reports || []).map((report) => report.user_id))];

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    const profileMap = new Map(
      (profiles || []).map((profile) => [profile.id, profile])
    );

    const reportsWithTechnicians = (reports || []).map((report) => {
      const technician = profileMap.get(report.user_id);

      return {
        ...report,
        technician_name: technician?.full_name || null,
        technician_email: technician?.email || null,
      };
    });

    return NextResponse.json({ reports: reportsWithTechnicians });
  } catch (error) {
    console.error("Admin all reports error:", error);

    return NextResponse.json(
      { error: "Failed to load all reports." },
      { status: 500 }
    );
  }
}