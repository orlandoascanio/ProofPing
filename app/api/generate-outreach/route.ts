import { NextResponse } from "next/server";
import {
  analysisProofJsonSchema,
  analysisProofResponseSchema,
  generateOutreachRequestSchema,
  messageGenerationJsonSchema,
  messageGenerationResponseSchema,
  qualityScoreJsonSchema,
  qualityScoreResponseSchema,
  outreachResponseSchema,
} from "@/lib/schemas";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const UTILITY_MODEL =
  process.env.OPENROUTER_UTILITY_MODEL ??
  process.env.OPENROUTER_MODEL ??
  "openai/gpt-5.4-nano";
const GENERATION_MODEL =
  process.env.OPENROUTER_GENERATION_MODEL ??
  process.env.OPENROUTER_MODEL ??
  "openai/gpt-5.4-mini";

export async function POST(req: Request) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY" },
        { status: 500 },
      );
    }

    const parsedBody = generateOutreachRequestSchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const analysisProof = analysisProofResponseSchema.parse(
      await callOpenRouter({
        model: UTILITY_MODEL,
        temperature: 0.15,
        schemaName: "opportunity_analysis_and_proof_selection",
        schema: analysisProofJsonSchema,
        system: `
You are a precise outreach research assistant.

Analyze the pasted opportunity and choose exactly one proof link from the user's proof bank.

Rules:
- Do not invent company facts, user experience, credentials, metrics, or relationships.
- Select the proof link only from the provided proofLinks array.
- The selected proof reason must explain why this link matches the opportunity.
- If the input is thin, say the generic risk plainly.
        `.trim(),
        user: parsedBody.data,
      }),
    );

    const generatedMessages = messageGenerationResponseSchema.parse(
      await callOpenRouter({
        model: GENERATION_MODEL,
        temperature: 0.4,
        schemaName: "outreach_message_generation",
        schema: messageGenerationJsonSchema,
        system: `
You are an expert founder/operator and sales copywriter.

Write outreach the user would actually send.

Rules:
- Generate exactly 3 variants.
- Keep each message short, usually 60 to 120 words.
- No em dashes.
- No corporate fluff.
- No "I hope this message finds you well."
- No fake compliments.
- No invented proof, credentials, metrics, or relationships.
- Use the selected proof link naturally.
- Every message must include one specific reason for reaching out.
- Include one short subject line or opener.
- Include one concise follow-up message.
        `.trim(),
        user: {
          ...parsedBody.data,
          ...analysisProof,
        },
      }),
    );

    const qualityScore = qualityScoreResponseSchema.parse(
      await callOpenRouter({
        model: UTILITY_MODEL,
        temperature: 0,
        schemaName: "outreach_quality_score",
        schema: qualityScoreJsonSchema,
        system: `
You are a strict outreach QA evaluator.

Score whether the generated outreach is specific, honest, and sendable.

Rules:
- Penalize generic phrasing.
- Penalize vague proof selection.
- Penalize long messages.
- Penalize invented details.
- Reward concrete personalization from the input.
- If the input lacks company-specific detail, generic_risk should be Medium or High.
        `.trim(),
        user: {
          ...parsedBody.data,
          ...analysisProof,
          ...generatedMessages,
        },
      }),
    );

    const validatedContent = outreachResponseSchema.parse({
      ...analysisProof,
      ...generatedMessages,
      ...qualityScore,
    });

    return NextResponse.json(validatedContent);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function callOpenRouter({
  model,
  temperature,
  schemaName,
  schema,
  system,
  user,
}: {
  model: string;
  temperature: number;
  schemaName: string;
  schema: object;
  system: string;
  user: unknown;
}) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-OpenRouter-Title": "ProofPing Outreach Generator",
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: JSON.stringify(user),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${model} request failed: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(`${model} returned no message content.`);
  }

  return typeof content === "string" ? JSON.parse(content) : content;
}
