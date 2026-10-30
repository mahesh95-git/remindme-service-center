import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { generateBookingCode } from '../../utils/bookingCode.js';
import { normalizeRegNumber } from '../vehicles/service.js';
import { CreateBookingInput } from './schema.js';
import { BookingStatus } from '@prisma/client';
import { createHash } from 'node:crypto';
import { EmailProvider } from '../../notifications/email.js';
import { ENV } from '../../config/env.js';

export function createInvoiceUploadSignature() {
  if (!ENV.CLOUDINARY_CLOUD_NAME || !ENV.CLOUDINARY_API_KEY || !ENV.CLOUDINARY_API_SECRET) {
    throw new AppError('Cloudinary signed upload is not configured on the server', 503);
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'service-invoices';
  const signature = createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${ENV.CLOUDINARY_API_SECRET}`)
    .digest('hex');
  return { cloud_name: ENV.CLOUDINARY_CLOUD_NAME, api_key: ENV.CLOUDINARY_API_KEY, timestamp, folder, signature };
}

export async function getSlotConfig() {
  const config = await prisma.slotConfig.findFirst();
  if (config) {
    return {
      working_hours_start: config.workingHoursStart.slice(0, 5),
      working_hours_end: config.workingHoursEnd.slice(0, 5),
      slot_duration_minutes: config.slotDurationMinutes,
      max_bookings_per_slot: config.maxBookingsPerSlot,
    };
  }
  return {
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    slot_duration_minutes: 60,
    max_bookings_per_slot: 4,
  };
}

function timeToMinutes(t: string): number {
  const [hh, mm] = t.slice(0, 5).split(':').map(Number);
  return hh * 60 + mm;
}

function minutesToTime(m: number): string {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function parseDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AppError('A valid booking date is required', 400);
  }
  return date;
}

export async function getAvailableSlotsService(dateStr: string, excludeBookingId?: number) {
  const targetDate = parseDateOnly(dateStr);
  const config = await getSlotConfig();
  const startMin = timeToMinutes(config.working_hours_start);
  const endMin = timeToMinutes(config.working_hours_end);
  const duration = config.slot_duration_minutes;

  const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

  const bookings = await prisma.booking.findMany({
    where: {
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      bookingDate: {
        gte: targetDate,
        lte: dayEnd,
      },
      status: {
        not: 'CANCELLED',
      },
    },
    select: {
      slotStart: true,
    },
  });

  const bookingsMap = new Map<string, number>();
  for (const b of bookings) {
    const key = b.slotStart.slice(0, 5);
    bookingsMap.set(key, (bookingsMap.get(key) || 0) + 1);
  }

  const slots = [];
  for (let current = startMin; current + duration <= endMin; current += duration) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + duration);
    const booked = bookingsMap.get(slotStart) || 0;
    const available = booked < config.max_bookings_per_slot;

    slots.push({
      slot_start: slotStart,
      slot_end: slotEnd,
      booked_count: booked,
      max_capacity: config.max_bookings_per_slot,
      is_available: available,
    });
  }

  return {
    date: dateStr,
    slots,
  };
}

export async function createBookingService(input: CreateBookingInput) {
  const todayStr = new Date().toISOString().split('T')[0];
  if (input.booking_date < todayStr) {
    throw new AppError('Cannot book an appointment for a past date', 400);
  }

  const service = await prisma.service.findFirst({
    where: { name: input.service_type, isActive: true },
    select: { id: true },
  });
  if (!service) {
    throw new AppError('Selected service is unavailable. Refresh the service list and try again.', 400);
  }

  const normalizedReg = normalizeRegNumber(input.reg_number);
  const vehicle = await prisma.vehicle.findUnique({
    where: { regNumber: normalizedReg },
    include: { customer: true },
  });

  if (!vehicle) {
    throw new AppError('Vehicle not found. Please visit service center.', 404);
  }

  const config = await getSlotConfig();
  const slotStartClean = input.slot_start.slice(0, 5);
  const startMin = timeToMinutes(slotStartClean);
  const slotEndClean = minutesToTime(startMin + config.slot_duration_minutes);

  const bookingDate = new Date(`${input.booking_date}T00:00:00.000Z`);
  const dayEnd = new Date(`${input.booking_date}T23:59:59.999Z`);

  return await prisma.$transaction(async (tx) => {
    const currentBooked = await tx.booking.count({
      where: {
        bookingDate: {
          gte: bookingDate,
          lte: dayEnd,
        },
        slotStart: slotStartClean,
        status: { not: 'CANCELLED' },
      },
    });

    if (currentBooked >= config.max_bookings_per_slot) {
      throw new AppError('Selected slot is fully booked. Please choose another slot.', 400);
    }

    let bookingCode = generateBookingCode(input.booking_date);
    let codeExists = true;
    while (codeExists) {
      const existing = await tx.booking.findUnique({ where: { bookingCode } });
      if (!existing) codeExists = false;
      else bookingCode = generateBookingCode(input.booking_date);
    }

    const booking = await tx.booking.create({
      data: {
        vehicleId: vehicle.id,
        customerId: vehicle.customerId,
        bookingDate,
        slotStart: slotStartClean,
        slotEnd: slotEndClean,
        contactName: input.contact_name.trim(),
        contactPhone: input.contact_phone.trim(),
        serviceType: input.service_type,
        status: 'CONFIRMED',
        bookingCode,
      },
      include: {
        vehicle: true,
        customer: true,
      },
    });

    return {
      ...booking,
      booking_code: booking.bookingCode,
      vehicle_reg: vehicle.regNumber,
      vehicle_name: `${vehicle.make} ${vehicle.model}`,
      booking_date: booking.bookingDate.toISOString().split('T')[0],
      slot_start: booking.slotStart,
      slot_end: booking.slotEnd,
    };
  });
}

export async function listBookingsService(filters?: {
  date?: string;
  status?: string;
  search?: string;
}) {
  const where: any = {};

  if (filters?.date) {
    const dayStart = new Date(`${filters.date}T00:00:00.000Z`);
    const dayEnd = new Date(`${filters.date}T23:59:59.999Z`);
    where.bookingDate = { gte: dayStart, lte: dayEnd };
  }

  if (filters?.status) {
    where.status = filters.status as BookingStatus;
  }

  if (filters?.search) {
    const s = filters.search.trim();
    where.OR = [
      { bookingCode: { contains: s, mode: 'insensitive' } },
      { contactName: { contains: s, mode: 'insensitive' } },
      { customer: { name: { contains: s, mode: 'insensitive' } } },
      { customer: { phone: { contains: s, mode: 'insensitive' } } },
      { vehicle: { regNumber: { contains: s, mode: 'insensitive' } } },
      { vehicle: { make: { contains: s, mode: 'insensitive' } } },
      { vehicle: { model: { contains: s, mode: 'insensitive' } } },
    ];
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      vehicle: true,
      customer: true,
      invoice: true,
      assignedStaff: { select: { id: true, name: true, role: true } },
    },
    orderBy: [{ bookingDate: 'desc' }, { slotStart: 'asc' }],
  });

  return bookings.map((b) => ({
    id: b.id,
    booking_code: b.bookingCode,
    vehicle_id: b.vehicleId,
    customer_id: b.customerId,
    assigned_staff_id: b.assignedStaffId,
    assigned_staff_name: b.assignedStaff?.name || null,
    assigned_staff_role: b.assignedStaff?.role || null,
    customer_name: b.customer.name,
    customer_phone: b.customer.phone,
    customer_email: b.customer.email,
    reg_number: b.vehicle.regNumber,
    vehicle_name: `${b.vehicle.make} ${b.vehicle.model}`,
    make: b.vehicle.make,
    model: b.vehicle.model,
    year: b.vehicle.year,
    booking_date: b.bookingDate.toISOString().split('T')[0],
    slot_start: b.slotStart,
    slot_end: b.slotEnd,
    contact_name: b.contactName,
    contact_phone: b.contactPhone,
    service_type: b.serviceType,
    status: b.status,
    invoice_id: b.invoice?.id || null,
    invoice_total: b.invoice ? parseFloat(b.invoice.total.toString()) : null,
    invoice_amount: b.invoice ? parseFloat(b.invoice.amount.toString()) : null,
    invoice_tax: b.invoice ? parseFloat(b.invoice.tax.toString()) : null,
    invoice_status: b.invoice?.paymentStatus || null,
    invoice_method: b.invoice?.paymentMethod || null,
    created_at: b.createdAt,
    updated_at: b.updatedAt,
  }));
}

export async function assignBookingStaffService(id: number, staffId: number | null) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new AppError('Appointment not found', 404);

  if (staffId !== null) {
    const staff = await prisma.user.findUnique({ where: { id: staffId }, select: { id: true, isActive: true } });
    if (!staff || !staff.isActive) throw new AppError('Choose an active staff account', 400);
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { assignedStaffId: staffId },
    include: { assignedStaff: { select: { id: true, name: true, role: true } } },
  });
  return {
    id: updated.id,
    assigned_staff_id: updated.assignedStaffId,
    assigned_staff_name: updated.assignedStaff?.name || null,
    assigned_staff_role: updated.assignedStaff?.role || null,
  };
}

export async function updateBookingStatusService(
  id: number,
  newStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED',
  invoicePhotoUrl?: string,
  nextServiceDate?: string,
  totalBill?: number,
) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { vehicle: true, customer: true, invoice: true },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.status === 'COMPLETED' && newStatus !== 'COMPLETED') {
    throw new AppError('Completed bookings cannot be reopened or cancelled', 400);
  }
  if (booking.status === 'CANCELLED' && newStatus === 'COMPLETED') {
    throw new AppError('Reopen the booking before marking it complete', 400);
  }
  const todayForStatus = new Date().toISOString().split('T')[0];
  const bookingDateForStatus = booking.bookingDate.toISOString().split('T')[0];
  if (newStatus === 'COMPLETED' && bookingDateForStatus > todayForStatus) {
    throw new AppError('A future booking cannot be marked complete', 400);
  }
  if (booking.status === 'CANCELLED' && newStatus === 'CONFIRMED' && bookingDateForStatus < todayForStatus) {
    throw new AppError('A past cancelled booking cannot be reopened', 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (booking.status === 'CANCELLED' && newStatus === 'CONFIRMED') {
      const dateStart = new Date(`${booking.bookingDate.toISOString().split('T')[0]}T00:00:00.000Z`);
      const dateEnd = new Date(`${booking.bookingDate.toISOString().split('T')[0]}T23:59:59.999Z`);
      const bookedCount = await tx.booking.count({
        where: {
          id: { not: id },
          bookingDate: { gte: dateStart, lte: dateEnd },
          slotStart: booking.slotStart,
          status: { not: 'CANCELLED' },
        },
      });
      const config = await getSlotConfig();
      if (bookedCount >= config.max_bookings_per_slot) {
        throw new AppError('This booking slot is now full. Reschedule it before reopening.', 400);
      }
    }

    const updatedBooking = await tx.booking.update({
      where: { id },
      data: { status: newStatus, ...(invoicePhotoUrl ? { invoicePhotoUrl } : {}) },
      include: { vehicle: true },
    });

    // If marked COMPLETED, advance next_service_date & record service history
    if (newStatus === 'COMPLETED' && booking.status !== 'COMPLETED') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const interval = booking.vehicle.serviceIntervalDays || 180;
      const nextDate = nextServiceDate ? parseDateOnly(nextServiceDate) : new Date();
      if (!nextServiceDate) nextDate.setDate(nextDate.getDate() + interval);

      if (totalBill !== undefined) {
        await tx.invoice.upsert({
          where: { bookingId: id },
          create: { bookingId: id, amount: totalBill, tax: 0, total: totalBill, paymentStatus: 'PAID', paidAt: new Date() },
          update: { amount: totalBill, tax: 0, total: totalBill, paymentStatus: 'PAID', paidAt: new Date() },
        });
      }
      const cost = totalBill ?? (booking.invoice ? parseFloat(booking.invoice.total.toString()) : 0.0);

      await tx.serviceHistory.create({
        data: {
          vehicleId: booking.vehicleId,
          serviceType: booking.serviceType,
          serviceDate: today,
          cost,
          notes: `Completed via Booking ${booking.bookingCode}`,
        },
      });

      await tx.vehicle.update({
        where: { id: booking.vehicleId },
        data: {
          lastServiceDate: today,
          nextServiceDate: nextDate,
        },
      });
    }

    return updatedBooking;
  });

  let completionEmail: { sent: boolean; error?: string } | undefined;
  if (newStatus === 'COMPLETED' && booking.status !== 'COMPLETED') {
    if (!booking.customer.email) {
      completionEmail = { sent: false, error: 'Customer does not have an email address' };
    } else {
      const result = await new EmailProvider().sendServiceCompletion({
        to: booking.customer.email,
        recipientName: booking.customer.name,
        serviceType: booking.serviceType,
        vehicleName: `${booking.vehicle.make} ${booking.vehicle.model}`,
        vehicleReg: booking.vehicle.regNumber,
        invoicePhotoUrl: invoicePhotoUrl || null,
        invoiceTotal: totalBill !== undefined ? totalBill.toFixed(2) : booking.invoice ? booking.invoice.total.toString() : null,
      });
      completionEmail = result.success ? { sent: true } : { sent: false, error: result.error };
    }
  }

  return { ...updated, completionEmail };
}

export async function completeBookingWithInvoiceService(id: number, invoicePhotoUrl: string, nextServiceDate: string | undefined, totalBill: number) {
  let parsedUrl: URL;
  try { parsedUrl = new URL(invoicePhotoUrl); } catch { throw new AppError('Invoice photo URL is invalid', 400); }
  if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'res.cloudinary.com') {
    throw new AppError('Invoice photo must be stored in Cloudinary', 400);
  }
  if (nextServiceDate) {
    const nextDate = parseDateOnly(nextServiceDate);
    if (nextDate < parseDateOnly(new Date().toISOString().slice(0, 10))) {
      throw new AppError('Next service date cannot be in the past', 400);
    }
  }
  const result = await updateBookingStatusService(id, 'COMPLETED', parsedUrl.toString(), nextServiceDate, totalBill);
  return { id: result.id, status: result.status, invoice_photo_url: parsedUrl.toString(), total_bill: totalBill, email_sent: result.completionEmail?.sent ?? false, email_error: result.completionEmail?.error };
}

export async function rescheduleBookingService(id: number, bookingDateStr: string, slotStartInput: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.status !== 'CONFIRMED') {
    throw new AppError('Only confirmed bookings can be rescheduled', 400);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (bookingDateStr < todayStr) throw new AppError('Cannot reschedule to a past date', 400);

  const config = await getSlotConfig();
  const slotStart = slotStartInput.slice(0, 5);
  const startMinutes = timeToMinutes(slotStart);
  const openMinutes = timeToMinutes(config.working_hours_start);
  const closeMinutes = timeToMinutes(config.working_hours_end);
  const slotEndMinutes = startMinutes + config.slot_duration_minutes;
  if (startMinutes < openMinutes || slotEndMinutes > closeMinutes || (startMinutes - openMinutes) % config.slot_duration_minutes !== 0) {
    throw new AppError('Selected time is not a valid service slot', 400);
  }

  const slotEnd = minutesToTime(slotEndMinutes);
  const dateStart = new Date(`${bookingDateStr}T00:00:00.000Z`);
  const dateEnd = new Date(`${bookingDateStr}T23:59:59.999Z`);

  return prisma.$transaction(async tx => {
    const bookedCount = await tx.booking.count({
      where: {
        id: { not: id },
        bookingDate: { gte: dateStart, lte: dateEnd },
        slotStart,
        status: { not: 'CANCELLED' },
      },
    });
    if (bookedCount >= config.max_bookings_per_slot) {
      throw new AppError('Selected slot is fully booked. Choose another available slot.', 400);
    }

    const updated = await tx.booking.update({
      where: { id },
      data: { bookingDate: dateStart, slotStart, slotEnd },
      include: { vehicle: true, customer: true },
    });
    return {
      id: updated.id,
      booking_code: updated.bookingCode,
      customer_name: updated.customer.name,
      reg_number: updated.vehicle.regNumber,
      make: updated.vehicle.make,
      model: updated.vehicle.model,
      service_type: updated.serviceType,
      booking_date: updated.bookingDate.toISOString().split('T')[0],
      slot_start: updated.slotStart,
      status: updated.status,
    };
  });
}
