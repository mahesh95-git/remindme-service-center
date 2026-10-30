import { z } from 'zod';

export const getSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const createBookingSchema = z.object({
  reg_number: z.string().min(3),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  slot_start: z.string().min(4), // e.g. '09:00' or '09:00:00'
  contact_name: z.string().min(2),
  contact_phone: z.string().min(7),
  contact_email: z.string().email().optional().or(z.literal('')),
  service_type: z.string().min(2).default('General service'),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']),
});

export const completeBookingSchema = z.object({
  invoice_photo_url: z.string().url().max(2048),
  next_service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  total_bill: z.number().finite().nonnegative(),
});

export const rescheduleBookingSchema = z.object({
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  slot_start: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Slot must be in HH:MM format'),
});

export const assignBookingStaffSchema = z.object({
  staff_id: z.number().int().positive().nullable(),
});

export const bookingSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const listBookingsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  search: z.string().trim().max(120).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
