import { z } from "zod";

export const outlineSchema = z.object({
  course: z.string().optional(),
  topics: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        parent: z.string().nullable().optional(),
        expected_concepts: z.array(z.string().max(160)).max(8).optional(),
      })
    )
    .min(1)
    .max(200),
});
export type OutlineResult = z.infer<typeof outlineSchema>;

export const assessmentSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string().max(300)).max(6).optional(),
  missing: z.array(z.string().max(300)).max(6).optional(),
  misconceptions: z.array(z.string().max(300)).max(5).optional(),
  feedback: z.string().max(900),
  revisit: z.string().max(300),
  followups: z.array(z.string().max(300)).max(2).optional(),
});
export type AssessmentResult = z.infer<typeof assessmentSchema>;
