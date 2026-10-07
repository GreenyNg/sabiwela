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
