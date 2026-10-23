import { z } from 'zod';

export const updateSlotConfigSchema = z.object({
  working_hours_start: z.string().optional(),
  working_hours_end: z.string().optional(),
  slot_duration_minutes: z.number().int().min(15).max(240).optional(),
  max_bookings_per_slot: z.number().int().min(1).max(20).optional(),
});
