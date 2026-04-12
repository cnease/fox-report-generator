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

type FinalReport = {
  subject: string;
  greeting: string;
  whatISaw: string;
  whatIDid: string;
  whatToExpect: string;
  whatIRecommend: string;
  closing: string;
};

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanTechnicianText(value: string) {
  let cleaned = normalizeWhitespace(value || "");

  if (!cleaned) return "";

  cleaned = cleaned
    .replace(/\bstored elevated\b/gi, "stored off the ground")
    .replace(
      /\bnot properly stored elevated\b/gi,
      "not properly stored off the ground"
    )
    .replace(/\bwould pile on the ground\b/gi, "was piled on the ground")
    .replace(
      /\bgrass clippings?,?\s+and the yard\b/gi,
      "grass clippings in the yard"
    )
    .replace(/\bwood pile on the ground\b/gi, "wood pile stored on the ground")
    .replace(
      /\bclippings were piled on the ground\b/gi,
      "grass clippings were piled on the ground"
    );

  return cleaned;
}

function buildCombinedEmail(report: FinalReport) {
  return `Subject: ${report.subject}

${report.greeting}

WHAT I SAW
${report.whatISaw}

WHAT I DID
${report.whatIDid}

WHAT TO EXPECT
${report.whatToExpect}

WHAT I RECOMMENDED
${report.whatIRecommend}

${report.closing}`;
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

    const cleanedFindings = cleanTechnicianText(findings);
    const cleanedTreatment = cleanTechnicianText(treatment);
    const cleanedNotes = cleanTechnicianText(notes);

    let visualFindings: VisualFinding[] = [];

    if (Array.isArray(images) && images.length > 0) {
      const imageAnalysisInput: Array<
        | { type: "input_text"; text: string }
        | { type: "input_image"; image_url: string; detail: "auto" }
      > = [
        {
          type: "input_text",
          text: `
You are analyzing technician-uploaded pest control photos for INTERNAL support only.

Your job:
- identify ONLY clearly visible pest-related conducive conditions or clearly visible pest-related findings
- do NOT infer hidden problems
- do NOT guess
- do NOT repeat technician notes unless they are actually visible in the image
- if no relevant issue is clearly visible, return an empty findings array
- do NOT create customer-facing language

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

      const parsed = safeJsonParse<{ visual_findings?: VisualFinding[] }>(
        rawVisualOutput,
        { visual_findings: [] }
      );

      visualFindings = Array.isArray(parsed.visual_findings)
        ? parsed.visual_findings.filter(
            (item) =>
              item?.clearly_visible === true &&
              typeof item?.finding === "string" &&
              item.finding.trim().length > 0
          )
        : [];
    }

    const visualFindingText =
      visualFindings.length > 0
        ? visualFindings.map((item) => `- ${item.finding}`).join("\n")
        : "None";

    const prompt = `
Write a professional Fox Pest Control technician service summary email.

Use the following information:

Customer Name: ${customerName || "Customer"}
Service Address: ${serviceAddress || "Service Address"}
Pest Type: ${pestType || "Not provided"}
Inspection Findings: ${cleanedFindings || "None provided"}
Treatment Performed: ${cleanedTreatment || "None provided"}
Technician Notes: ${cleanedNotes || "None provided"}

Validated Internal Visual Support:
${visualFindingText}

Rules:
- Use the technician's written findings, treatment, and notes as the main source.

- Rewrite all technician-entered notes into clear, natural, customer-friendly language.
- Do NOT copy awkward or unclear phrasing directly from technician input.
- If wording is unclear, interpret the intent and rewrite it professionally.

- Avoid unnatural or robotic phrasing such as:
  "stored elevated off the ground"
  "not properly stored elevated"
  or similar awkward constructions.

- When referring to yard debris or grass clippings, use natural phrasing such as:
  "bagged and removed"
  "properly stored"
  "cleared from the yard"
  "not left piled on the ground"

- Always prioritize clarity over literal wording.

- Use the validated internal visual support ONLY if it is listed above.
- If "Validated Internal Visual Support" is "None", do not add any image-based findings.

- Do NOT mention photos, images, uploads, or visual analysis.
- Do NOT say "based on the pictures" or anything similar.
- Do NOT create a separate visual findings section.

- Keep the same Fox Pest Control style and sections.
- Use the technician-entered treatment as the source for WHAT I DID.
- Write naturally as part of the service summary.

- Return ONLY valid JSON.

Return JSON in this exact format:
{
  "subject": "Fox Pest Control Service Summary – ${serviceAddress || "Service Address"}",
  "greeting": "Hello ${customerName || "Customer"},",
  "whatISaw": "",
  "whatIDid": "",
  "whatToExpect": "",
  "whatIRecommend": "",
  "closing": "Thank you for choosing Fox Pest Control!\\nPlease consider leaving us a 5-Star Rating if you were happy with today's service."
}
    `.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const rawReportOutput = response.output_text?.trim() || "";

    const fallbackReport: FinalReport = {
      subject: `Fox Pest Control Service Summary – ${serviceAddress || "Service Address"}`,
      greeting: `Hello ${customerName || "Customer"},`,
      whatISaw:
        "Today I inspected the property for reported pest activity and reviewed the areas of concern noted during service.",
      whatIDid:
        "I completed the treatment and service steps based on the conditions observed and the needs discussed during today's visit.",
      whatToExpect:
        "You may continue to notice some activity shortly after treatment as the product takes effect over the next several days.",
      whatIRecommend:
        "Please continue to monitor the affected areas and follow the service recommendations provided to help reduce future pest activity.",
      closing:
        "Thank you for choosing Fox Pest Control!\nPlease consider leaving us a 5-Star Rating if you were happy with today's service.",
    };

    const report = safeJsonParse<FinalReport>(rawReportOutput, fallbackReport);
    const output = buildCombinedEmail(report);

    return NextResponse.json({
      report,
      output,
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