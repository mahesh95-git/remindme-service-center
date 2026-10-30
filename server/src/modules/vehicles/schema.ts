import { z } from 'zod';

export const createVehicleSchema = z.object({
  customer_id: z.number().int().positive(),
  reg_number: z.string().min(3),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1980).max(2100).optional().nullable(),
  purchase_date: z.string().optional().nullable(),
  insurance_expiry: z.string().optional().nullable(),
  puc_expiry: z.string().optional().nullable(),
  warranty_expiry: z.string().optional().nullable(),
  service_interval_days: z.number().int().min(30).default(180),
  last_service_date: z.string().optional().nullable(),
  next_service_date: z.string().optional().nullable(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const sendManualReminderSchema = z.object({
  reminder_type: z.enum(['SERVICE', 'INSURANCE', 'PUC', 'WARRANTY']).default('SERVICE'),
});

export const registerVehicleWithCustomerSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(7),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
  }),
  vehicle: z.object({
    reg_number: z.string().min(3),
    make: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int().min(1980).max(2100).optional().nullable(),
    purchase_date: z.string().optional().nullable(),
    insurance_expiry: z.string().optional().nullable(),
    puc_expiry: z.string().optional().nullable(),
    warranty_expiry: z.string().optional().nullable(),
    service_interval_days: z.number().int().min(30).default(180),
    last_service_date: z.string().optional().nullable(),
    next_service_date: z.string().optional().nullable(),
  }),
});

export type RegisterVehicleWithCustomerInput = z.infer<typeof registerVehicleWithCustomerSchema>;

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
