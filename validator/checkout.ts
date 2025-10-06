// validator/checkout.ts
import { z } from 'zod';

export const SHIPPING_VALUES = ['JNT', 'JNE'] as const;
export const PAYMENT_VALUES = ['BNI', 'BRI', 'BCA', 'MANDIRI'] as const;

export type ShippingCode = (typeof SHIPPING_VALUES)[number];
export type PaymentCode = (typeof PAYMENT_VALUES)[number];

export const nameSchema = z
  .string()
  .trim()
  .min(2, { message: 'please enter correct name minimal 2 character name' });

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d+$/, {
    message:
      "phone number must be number boleh dengan '0' maupun (+62) yang penting number dan special character hanya +",
  });

export const citySchema = z.string().trim().min(1, { message: 'City Text' });

export const postalSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, { message: 'postal code number' });

/** Bebas teks, minimal 5 karakter */
export const addressSchema = z
  .string()
  .trim()
  .min(5, { message: 'Address minimal 5 karakter' });

/** shipping opsional dulu agar bisa mulai “Select Shipping”, tapi tetap diwajibkan via refine */
export const CheckoutFormSchema = z
  .object({
    name: nameSchema,
    phone: phoneSchema,
    city: citySchema,
    postal: postalSchema,
    address: addressSchema,
    shipping: z.enum(SHIPPING_VALUES).optional(),
    payment: z.enum(PAYMENT_VALUES).default('BNI'),
  })
  .refine((d) => !!d.shipping, {
    path: ['shipping'],
    message: 'Pilih shipping method',
  });

export type CheckoutFormValues = z.infer<typeof CheckoutFormSchema>;
