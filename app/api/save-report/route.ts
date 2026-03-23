import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,
      customerName,
      serviceAddress,
      pestType,
      findings,
      treatment,
      notes,
      generatedEmail,
      imageUrls,
    } = body;

    // ✅ Basic validation
    if (!userId || !customerName || !serviceAddress || !generatedEmail) {
      return NextResponse.json(
        { error: "Missing required report fields." },
        { status: 400 }
      );
    }

    // ✅ Insert into Supabase
    const { error } = await supabaseAdmin.from("reports").insert({
      user_id: userId,
      customer_name: customerName,
      service_address: serviceAddress,
      pest_type: pestType,
      findings,
      treatment,
      notes,
      generated_email: generatedEmail,
      image_urls: Array.isArray(imageUrls) ? imageUrls : [],
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save report error:", error);

    return NextResponse.json(
      { error: "Unexpected error saving report." },
      { status: 500 }
    );
  }
}