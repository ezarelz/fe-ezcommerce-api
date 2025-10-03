import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(6, 'Min. 6 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, 'Min. 2 characters'),
  email: z.email('Invalid email'),
  password: z.string().min(6, 'Min. 6 characters'),
});
export type RegisterInput = z.infer<typeof registerSchema>;
