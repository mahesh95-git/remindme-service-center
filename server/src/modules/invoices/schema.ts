import { z } from 'zod';

export const createInvoiceSchema = z.object({
  booking_id: z.number().int().positive().optional().nullable(),
  amount: z.number().nonnegative(),
  tax: z.number().nonnegative().default(0),
  total: z.number().nonnegative().optional(),
  payment_status: z.enum(['UNPAID', 'PAID']).default('UNPAID'),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
