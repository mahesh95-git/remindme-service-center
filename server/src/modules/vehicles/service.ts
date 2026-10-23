import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CreateVehicleInput, RegisterVehicleWithCustomerInput, UpdateVehicleInput } from './schema.js';
import { EmailProvider } from '../../notifications/email.js';
import { NotificationPayload } from '../../notifications/adapter.js';
import { ENV } from '../../config/env.js';

export function normalizeRegNumber(reg: string): string {
  return reg.replace(/[\s-]/g, '').toUpperCase();
}

export async function sendManualReminderService(id: number, reminderType: 'SERVICE' | 'INSURANCE' | 'PUC' | 'WARRANTY') {
  const vehicle = await prisma.vehicle.findUnique({ where: { id }, include: { customer: true } });
  if (!vehicle) throw new AppError('Vehicle not found', 404);
  if (!vehicle.customer.email) throw new AppError('Customer does not have an email address', 400);

  const details = {
    SERVICE: { dueDate: vehicle.nextServiceDate, label: 'Periodic Car Service' },
    INSURANCE: { dueDate: vehicle.insuranceExpiry, label: 'Insurance Policy' },
    PUC: { dueDate: vehicle.pucExpiry, label: 'PUC Certificate' },
    WARRANTY: { dueDate: vehicle.warrantyExpiry, label: 'Vehicle Warranty' },
  }[reminderType];
  const dueDate = details.dueDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
  const payload: NotificationPayload = {
    to: vehicle.customer.email,
    recipientName: vehicle.customer.name,
    message: `This is a manual reminder for your ${vehicle.make} ${vehicle.model} (${vehicle.regNumber}). Your ${details.label} is due on ${dueDate}.`,
    serviceType: details.label,
    vehicleReg: vehicle.regNumber,
    reminderType,
    dueDate,
    bookingUrl: `${ENV.CLIENT_URL}/book?reg=${encodeURIComponent(vehicle.regNumber)}`,
  };
  const result = await new EmailProvider().send(payload);
  const created = await prisma.reminder.create({
    data: {
      vehicleId: id,
      type: reminderType,
      dueDate: details.dueDate || new Date(),
      leadDays: 0,
      channel: 'EMAIL',
      status: result.success ? 'SENT' : 'FAILED',
      sentAt: result.success ? new Date() : null,
      errorMessage: result.error || null,
    },
  });
  if (!result.success) throw new AppError(result.error || 'Unable to send reminder email', 502);
  return { id: created.id, status: created.status, recipient: vehicle.customer.email };
}

export function formatRegNumberDisplay(reg: string): string {
  const clean = normalizeRegNumber(reg);
  if (clean.length >= 8) {
    const state = clean.slice(0, 2);
    const rto = clean.slice(2, 4);
    const letters = clean.slice(4, clean.length - 4);
    const digits = clean.slice(clean.length - 4);
    return `${state} ${rto} ${letters} ${digits}`.trim();
  }
  return clean;
}

export async function getVehiclesService(search?: string) {
  const where: any = {};
  if (search) {
    const s = search.trim();
    where.OR = [
      { regNumber: { contains: s, mode: 'insensitive' } },
      { make: { contains: s, mode: 'insensitive' } },
      { model: { contains: s, mode: 'insensitive' } },
      { customer: { name: { contains: s, mode: 'insensitive' } } },
    ];
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return vehicles.map((v) => ({
    id: v.id,
    customer_id: v.customerId,
    customer_name: v.customer.name,
    customer_phone: v.customer.phone,
    customer_email: v.customer.email,
    reg_number: v.regNumber,
    make: v.make,
    model: v.model,
    year: v.year,
    purchase_date: v.purchaseDate ? v.purchaseDate.toISOString().split('T')[0] : null,
    insurance_expiry: v.insuranceExpiry ? v.insuranceExpiry.toISOString().split('T')[0] : null,
    puc_expiry: v.pucExpiry ? v.pucExpiry.toISOString().split('T')[0] : null,
    warranty_expiry: v.warrantyExpiry ? v.warrantyExpiry.toISOString().split('T')[0] : null,
    service_interval_days: v.serviceIntervalDays,
    last_service_date: v.lastServiceDate ? v.lastServiceDate.toISOString().split('T')[0] : null,
    next_service_date: v.nextServiceDate ? v.nextServiceDate.toISOString().split('T')[0] : null,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
  }));
}

export async function getVehicleByIdService(id: number) {
  const v = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      customer: true,
      serviceHistory: { orderBy: { serviceDate: 'desc' } },
      bookings: { orderBy: { bookingDate: 'desc' }, include: { invoice: true } },
      reminders: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!v) {
    throw new AppError('Vehicle not found', 404);
  }

  const dateOnly = (value: Date | null) => value ? value.toISOString().split('T')[0] : null;
  return {
    id: v.id,
    reg_number: v.regNumber,
    make: v.make,
    model: v.model,
    year: v.year,
    purchase_date: dateOnly(v.purchaseDate),
    insurance_expiry: dateOnly(v.insuranceExpiry),
    puc_expiry: dateOnly(v.pucExpiry),
    warranty_expiry: dateOnly(v.warrantyExpiry),
    service_interval_days: v.serviceIntervalDays,
    last_service_date: dateOnly(v.lastServiceDate),
    next_service_date: dateOnly(v.nextServiceDate),
    created_at: v.createdAt,
    updated_at: v.updatedAt,
    customer: {
      id: v.customer.id,
      name: v.customer.name,
      phone: v.customer.phone,
      email: v.customer.email,
      address: v.customer.address,
    },
    service_history: v.serviceHistory.map((entry) => ({
      id: entry.id,
      service_type: entry.serviceType,
      service_date: dateOnly(entry.serviceDate),
      cost: Number(entry.cost),
      notes: entry.notes,
      created_at: entry.createdAt,
    })),
    bookings: v.bookings.map((booking) => ({
      id: booking.id,
      booking_code: booking.bookingCode,
      booking_date: dateOnly(booking.bookingDate),
      slot_start: booking.slotStart,
      slot_end: booking.slotEnd,
      service_type: booking.serviceType,
      status: booking.status,
      invoice: booking.invoice ? {
        id: booking.invoice.id,
        total: Number(booking.invoice.total),
        payment_status: booking.invoice.paymentStatus,
      } : null,
    })),
    reminders: v.reminders.map((reminder) => ({
      id: reminder.id,
      type: reminder.type,
      due_date: dateOnly(reminder.dueDate),
      lead_days: reminder.leadDays,
      channel: reminder.channel,
      status: reminder.status,
      sent_at: reminder.sentAt,
      error_message: reminder.errorMessage,
      created_at: reminder.createdAt,
    })),
  };
}

export async function lookupVehicleByRegService(regNumber: string) {
  const normalized = normalizeRegNumber(regNumber);

  // Search case-insensitive and stripped
  const allVehicles = await prisma.vehicle.findMany({
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  const found = allVehicles.find((v) => normalizeRegNumber(v.regNumber) === normalized);

  if (!found) {
    throw new AppError('Vehicle not found. Please visit service center.', 404);
  }

  return {
    id: found.id,
    customer_id: found.customerId,
    customer_name: found.customer.name,
    customer_phone: found.customer.phone,
    customer_email: found.customer.email,
    reg_number: found.regNumber,
    make: found.make,
    model: found.model,
    year: found.year,
    last_service_date: found.lastServiceDate ? found.lastServiceDate.toISOString().split('T')[0] : null,
    next_service_date: found.nextServiceDate ? found.nextServiceDate.toISOString().split('T')[0] : null,
    insurance_expiry: found.insuranceExpiry ? found.insuranceExpiry.toISOString().split('T')[0] : null,
    puc_expiry: found.pucExpiry ? found.pucExpiry.toISOString().split('T')[0] : null,
    warranty_expiry: found.warrantyExpiry ? found.warrantyExpiry.toISOString().split('T')[0] : null,
  };
}

export async function createVehicleService(input: CreateVehicleInput) {
  const normalized = normalizeRegNumber(input.reg_number);

  const existing = await prisma.vehicle.findUnique({
    where: { regNumber: normalized },
  });
  if (existing) {
    throw new AppError(`Vehicle with registration ${input.reg_number} is already registered`, 400);
  }

  let nextServiceDate = input.next_service_date ? new Date(input.next_service_date) : null;
  if (!nextServiceDate && input.last_service_date) {
    const last = new Date(input.last_service_date);
    last.setDate(last.getDate() + (input.service_interval_days || 180));
    nextServiceDate = last;
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      customerId: input.customer_id,
      regNumber: normalized,
      make: input.make.trim(),
      model: input.model.trim(),
      year: input.year,
      purchaseDate: input.purchase_date ? new Date(input.purchase_date) : null,
      insuranceExpiry: input.insurance_expiry ? new Date(input.insurance_expiry) : null,
      pucExpiry: input.puc_expiry ? new Date(input.puc_expiry) : null,
      warrantyExpiry: input.warranty_expiry ? new Date(input.warranty_expiry) : null,
      serviceIntervalDays: input.service_interval_days || 180,
      lastServiceDate: input.last_service_date ? new Date(input.last_service_date) : null,
      nextServiceDate,
    },
  });

  return vehicle;
}

export async function registerVehicleWithCustomerService(input: RegisterVehicleWithCustomerInput) {
  const normalized = normalizeRegNumber(input.vehicle.reg_number);
  const existing = await prisma.vehicle.findUnique({ where: { regNumber: normalized } });
  if (existing) {
    throw new AppError(`Vehicle with registration ${input.vehicle.reg_number} is already registered`, 400);
  }

  return prisma.$transaction(async tx => {
    const customer = await tx.customer.create({
      data: {
        name: input.customer.name.trim(),
        phone: input.customer.phone.trim(),
        email: input.customer.email?.trim() || null,
        address: input.customer.address?.trim() || null,
      },
    });
    let nextServiceDate = input.vehicle.next_service_date ? new Date(input.vehicle.next_service_date) : null;
    if (!nextServiceDate && input.vehicle.last_service_date) {
      nextServiceDate = new Date(input.vehicle.last_service_date);
      nextServiceDate.setDate(nextServiceDate.getDate() + input.vehicle.service_interval_days);
    }
    const vehicle = await tx.vehicle.create({
      data: {
        customerId: customer.id,
        regNumber: normalized,
        make: input.vehicle.make.trim(),
        model: input.vehicle.model.trim(),
        year: input.vehicle.year,
        purchaseDate: input.vehicle.purchase_date ? new Date(input.vehicle.purchase_date) : null,
        insuranceExpiry: input.vehicle.insurance_expiry ? new Date(input.vehicle.insurance_expiry) : null,
        pucExpiry: input.vehicle.puc_expiry ? new Date(input.vehicle.puc_expiry) : null,
        warrantyExpiry: input.vehicle.warranty_expiry ? new Date(input.vehicle.warranty_expiry) : null,
        serviceIntervalDays: input.vehicle.service_interval_days,
        lastServiceDate: input.vehicle.last_service_date ? new Date(input.vehicle.last_service_date) : null,
        nextServiceDate,
      },
    });
    return {
      id: vehicle.id,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      reg_number: vehicle.regNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
    };
  });
}

export async function updateVehicleService(id: number, input: UpdateVehicleInput) {
  const current = await prisma.vehicle.findUnique({ where: { id } });
  if (!current) {
    throw new AppError('Vehicle not found', 404);
  }

  const data: any = {};

  if (input.reg_number) {
    const normalized = normalizeRegNumber(input.reg_number);
    const dup = await prisma.vehicle.findFirst({
      where: {
        regNumber: normalized,
        NOT: { id },
      },
    });
    if (dup) {
      throw new AppError(`Another vehicle already has registration ${input.reg_number}`, 400);
    }
    data.regNumber = normalized;
  }

  if (input.customer_id !== undefined) data.customerId = input.customer_id;
  if (input.make !== undefined) data.make = input.make.trim();
  if (input.model !== undefined) data.model = input.model.trim();
  if (input.year !== undefined) data.year = input.year;
  if (input.purchase_date !== undefined) data.purchaseDate = input.purchase_date ? new Date(input.purchase_date) : null;
  if (input.insurance_expiry !== undefined) data.insuranceExpiry = input.insurance_expiry ? new Date(input.insurance_expiry) : null;
  if (input.puc_expiry !== undefined) data.pucExpiry = input.puc_expiry ? new Date(input.puc_expiry) : null;
  if (input.warranty_expiry !== undefined) data.warrantyExpiry = input.warranty_expiry ? new Date(input.warranty_expiry) : null;
  if (input.service_interval_days !== undefined) data.serviceIntervalDays = input.service_interval_days;

  const intervalDays = input.service_interval_days ?? current.serviceIntervalDays;

  if (input.next_service_date !== undefined) {
    data.nextServiceDate = input.next_service_date ? new Date(input.next_service_date) : null;
  } else if (input.last_service_date) {
    const last = new Date(input.last_service_date);
    last.setDate(last.getDate() + intervalDays);
    data.nextServiceDate = last;
  }

  if (input.last_service_date !== undefined) {
    data.lastServiceDate = input.last_service_date ? new Date(input.last_service_date) : null;
  }

  const updated = await prisma.vehicle.update({
    where: { id },
    data,
  });

  return updated;
}

export async function deleteVehicleService(id: number) {
  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Vehicle not found', 404);
  }

  await prisma.vehicle.delete({ where: { id } });
  return { id };
}
