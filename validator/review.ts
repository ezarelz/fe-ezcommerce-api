// src/validator/review.ts
import { z } from 'zod';
export const ReviewSchema = z.object({
  star: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(1000),
});
export type ReviewValues = z.infer<typeof ReviewSchema>;
