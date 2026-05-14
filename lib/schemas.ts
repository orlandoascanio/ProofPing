import { z } from "zod";

export const goals = [
  "job",
  "freelance",
  "founder_networking",
  "partnership",
  "cold_dm",
] as const;

export const tones = ["direct", "friendly", "confident", "technical"] as const;

export const proofLinkSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  tags: z.array(z.string().min(1)),
  description: z.string().min(1),
});

export const generateOutreachRequestSchema = z.object({
  targetText: z.string().min(40, "Paste a real job post, company description, or profile."),
  goal: z.enum(goals),
  tone: z.enum(tones).default("direct"),
  proofLinks: z.array(proofLinkSchema).min(1, "Select at least one proof link."),
});

export const outreachResponseSchema = z.object({
  analysis: z.object({
    company_or_role: z.string(),
    likely_pain: z.string(),
    needed_skills: z.array(z.string()),
    best_angle: z.string(),
    risk_of_generic_message: z.string(),
  }),
  selected_proof: z.object({
    title: z.string(),
    url: z.string(),
    reason: z.string(),
  }),
  messages: z
    .array(
      z.object({
        label: z.string(),
        message: z.string(),
        best_for: z.string(),
      }),
    )
    .length(3),
  subject_line: z.string(),
  follow_up: z.string(),
  quality_score: z.object({
    specificity_score: z.number().min(0).max(10),
    generic_risk: z.string(),
    personalization_used: z.array(z.string()),
    weak_points: z.array(z.string()),
    why_it_works: z.string(),
    improvement_suggestion: z.string(),
  }),
});

export type GenerateOutreachRequest = z.infer<typeof generateOutreachRequestSchema>;
export type OutreachResponse = z.infer<typeof outreachResponseSchema>;

export const analysisProofResponseSchema = outreachResponseSchema.pick({
  analysis: true,
  selected_proof: true,
});

export const messageGenerationResponseSchema = outreachResponseSchema.pick({
  messages: true,
  subject_line: true,
  follow_up: true,
});

export const qualityScoreResponseSchema = outreachResponseSchema.pick({
  quality_score: true,
});

export const analysisProofJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    analysis: {
      type: "object",
      additionalProperties: false,
      properties: {
        company_or_role: { type: "string" },
        likely_pain: { type: "string" },
        needed_skills: {
          type: "array",
          items: { type: "string" },
        },
        best_angle: { type: "string" },
        risk_of_generic_message: { type: "string" },
      },
      required: [
        "company_or_role",
        "likely_pain",
        "needed_skills",
        "best_angle",
        "risk_of_generic_message",
      ],
    },
    selected_proof: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        url: { type: "string" },
        reason: { type: "string" },
      },
      required: ["title", "url", "reason"],
    },
  },
  required: ["analysis", "selected_proof"],
} as const;

export const messageGenerationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    messages: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          message: { type: "string" },
          best_for: { type: "string" },
        },
        required: ["label", "message", "best_for"],
      },
    },
    subject_line: { type: "string" },
    follow_up: { type: "string" },
  },
  required: ["messages", "subject_line", "follow_up"],
} as const;

export const qualityScoreJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    quality_score: {
      type: "object",
      additionalProperties: false,
      properties: {
        specificity_score: { type: "number" },
        generic_risk: { type: "string" },
        personalization_used: {
          type: "array",
          items: { type: "string" },
        },
        weak_points: {
          type: "array",
          items: { type: "string" },
        },
        why_it_works: { type: "string" },
        improvement_suggestion: { type: "string" },
      },
      required: [
        "specificity_score",
        "generic_risk",
        "personalization_used",
        "weak_points",
        "why_it_works",
        "improvement_suggestion",
      ],
    },
  },
  required: ["quality_score"],
} as const;
