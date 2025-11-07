import { z } from 'zod';

export const sellerActivateSchema = z.object({
  name: z
    .string()
    .min(3, 'Shop name must be at least 3 characters long')
    .max(50, 'Shop name too long'),
  slug: z.string().optional().or(z.literal('')),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters long')
    .max(100, 'Address too long'),
  logo: z.any().optional(),
});

export type SellerActivateFormData = z.infer<typeof sellerActivateSchema>;
