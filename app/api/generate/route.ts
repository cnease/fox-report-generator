import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      customerName,
      serviceAddress,
      pestType,
      findings,
      treatment,
    } = body;

    const prompt = `
Write a professional Fox Pest Control technician service summary email.

Use the following information:

Customer Name: ${customerName}
Service Address: ${serviceAddress}
Pest Type: ${pestType}
Inspection Findings: ${findings}
Treatment Performed: ${treatment}

Format the email exactly using these sections:

Subject: Fox Pest Control Service Summary – ${serviceAddress}

Hello ${customerName},

WHAT I SAW
Explain what pest activity or conducive conditions were observed during the inspection.

WHAT I DID
Explain the treatment the technician performed.

WHAT TO EXPECT
Explain what the homeowner should expect over the next few days after treatment.

WHAT I RECOMMENDED
Provide clear recommendations to reduce pest activity around the home.

End the email exactly with this message:

Thank you for choosing Fox Pest Control!
Please consider leaving us a 5-Star Rating if you were happy with today's service.

Use a friendly, professional tone that is easy for homeowners to understand.
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    return NextResponse.json({
      output: response.output_text,
    });

  } catch (error) {
    console.error("OpenAI error:", error);

    return NextResponse.json(
      { error: "Failed to generate email." },
      { status: 500 }
    );
  }
}