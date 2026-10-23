import { z } from 'zod';

export const createServiceHistorySchema = z.object({
  service_type: z.string().min(2),
  service_date: z.string().min(8), // YYYY-MM-DD
  cost: z.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
});

export type CreateServiceHistoryInput = z.infer<typeof createServiceHistorySchema>;
