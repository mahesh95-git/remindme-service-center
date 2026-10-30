import { z } from 'zod';

export const triggerRemindersSchema = z.object({
  targetDate: z.string().optional(), // YYYY-MM-DD override for simulation/testing
  leadDays: z.array(z.number().int()).optional(), // custom lead days e.g. [30, 15, 7, 1]
});

export const getRemindersFilterSchema = z.object({
  type: z.enum(['SERVICE', 'INSURANCE', 'PUC', 'WARRANTY']).optional(),
  channel: z.enum(['SMS', 'EMAIL', 'WHATSAPP', 'IN_APP']).optional(),
  status: z.enum(['PENDING', 'SENT', 'FAILED']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const sendManualReminderSchema = z.object({
  vehicleId: z.number().int().positive(),
  reminderType: z.enum(['SERVICE', 'INSURANCE', 'PUC', 'WARRANTY']).default('SERVICE'),
  channel: z.enum(['SMS', 'EMAIL', 'WHATSAPP']).default('EMAIL'),
  message: z.string().trim().min(1).max(2000),
});

export const sendDuePeriodRemindersSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
