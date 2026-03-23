import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type UploadedImage = {
  name: string;
  type: string;
  publicUrl: string;
};

type VisualFinding = {
  finding: string;
  category: "conducive_condition" | "pest_evidence" | "other";
  clearly_visible: boolean;
};

function cleanGeneratedText(value: string) {
  try {
    let cleaned = value.trim();

    if (cleaned.toLowerCase().startsWith("mailto:")) {
      const bodyMatch = cleaned.match(/[?&]body=([^&]*)/i);
      if (bodyMatch?.[1]) {
        cleaned = bodyMatch[1];
      }
    }

    while (/%[0-9A-Fa-f]{2}/.test(cleaned)) {
      const decoded = decodeURIComponent(cleaned);
      if (decoded === cleaned) break;
      cleaned = decoded;
    }

    return cleaned;
  } catch {
    return value;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      customerName,
      serviceAddress,
      pestType,
      findings,
      treatment,
      notes,
      images = [],
    }: {
      customerName: string;
      serviceAddress: string;
      pestType: string;
      findings: string;
      treatment: string;
      notes: string;
      images: UploadedImage[];
    } = body;

    let visualFindings: VisualFinding[] = [];

    if (Array.isArray(images) && images.length > 0) {
      const imageAnalysisInput: Array<
        | { type: "input_text"; text: string }
        | { type: "input_image"; image_url: string; detail: "auto" }
      > = [
        {
          type: "input_text",
          text: `
You are analyzing technician-uploaded pest control photos.

Your job:
- identify ONLY clearly visible conducive conditions or clearly visible pest-related findings
- do NOT infer hidden problems
- do NOT guess
- do NOT repeat technician notes
- if no relevant issue is clearly visible, return an empty findings array

Return ONLY valid JSON in this exact format:
{
  "visual_findings": [
    {
      "finding": "short description",
      "category": "conducive_condition",
      "clearly_visible": true
    }
  ]
}

Allowed category values:
- conducive_condition
- pest_evidence
- other

If nothing relevant is clearly visible, return:
{ "visual_findings": [] }
          `.trim(),
        },
      ];

      for (const image of images) {
        imageAnalysisInput.push({
          type: "input_image",
          image_url: image.publicUrl,
          detail: "auto",
        });
      }

      const imageResponse = await client.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: imageAnalysisInput,
          },
        ],
      });

      const rawVisualOutput = imageResponse.output_text?.trim() || "";

      try {
        const parsed = JSON.parse(rawVisualOutput);
        visualFindings = Array.isArray(parsed.visual_findings)
          ? parsed.visual_findings.filter(
              (item: VisualFinding) =>
                item?.clearly_visible === true &&
                typeof item?.finding === "string"
            )
          : [];
      } catch (parseError) {
        console.error("Visual findings JSON parse error:", parseError);
        console.error("Raw visual output:", rawVisualOutput);
        visualFindings = [];
      }
    }

    const visualFindingText =
      visualFindings.length > 0
        ? visualFindings.map((item) => `- ${item.finding}`).join("\n")
        : "None";

    const prompt = `
Write a professional Fox Pest Control technician service summary email.

Use the following information:

Customer Name: ${customerName}
Service Address: ${serviceAddress}
Pest Type: ${pestType}
Inspection Findings: ${findings || "None provided"}
Treatment Performed: ${treatment || "None provided"}
Technician Notes: ${notes || "None provided"}

Validated Additional Findings:
${visualFindingText}

Rules:
- Use the technician's written findings, treatment, and notes as the main source.
- Use the validated additional findings ONLY if they are listed above.
- If "Validated Additional Findings" is "None", do not add any image-based findings.
- Do NOT mention photos, images, uploads, or visual analysis.
- Do NOT say "based on the pictures" or anything similar.
- If the images do not clearly show a conducive condition, do not include one.
- Write naturally as part of the service summary.

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

Do not URL-encode, percent-encode, or format as a mailto link.
Return normal readable plain text only.
    `.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const cleanOutput = cleanGeneratedText(response.output_text);

    return NextResponse.json({
      output: cleanOutput,
      visualFindings,
      imageUrls: images.map((image) => image.publicUrl),
    });
  } catch (error) {
    console.error("OpenAI error:", error);

    return NextResponse.json(
      { error: "Failed to generate summary." },
      { status: 500 }
    );
  }
}