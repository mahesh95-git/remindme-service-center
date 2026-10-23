import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CreateInvoiceInput } from './schema.js';
import { PaymentStatus } from '@prisma/client';

export async function listInvoicesService(status?: string) {
  const where: any = {};
  if (status) {
    where.paymentStatus = status as PaymentStatus;
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      booking: {
        include: {
          vehicle: true,
          customer: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return invoices.map((inv) => ({
    id: inv.id,
    booking_id: inv.bookingId,
    booking_code: inv.booking?.bookingCode || null,
    amount: parseFloat(inv.amount.toString()),
    tax: parseFloat(inv.tax.toString()),
    total: parseFloat(inv.total.toString()),
    payment_status: inv.paymentStatus,
    paid_at: inv.paidAt,
    created_at: inv.createdAt,
    customer_name: inv.booking?.customer.name || 'Walk-in Customer',
    customer_phone: inv.booking?.customer.phone || null,
    customer_email: inv.booking?.customer.email || null,
    reg_number: inv.booking?.vehicle.regNumber || null,
    vehicle_name: inv.booking ? `${inv.booking.vehicle.make} ${inv.booking.vehicle.model}` : null,
  }));
}

export async function createInvoiceService(input: CreateInvoiceInput) {
  if (input.booking_id) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.booking_id },
      include: { invoice: true },
    });
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }
    if (booking.invoice) {
      throw new AppError('An invoice has already been generated for this booking', 400);
    }
  }

  const tax = input.tax ?? 0;
  const total = input.total ?? input.amount + tax;
  const paidAt = input.payment_status === 'PAID' ? new Date() : null;

  const invoice = await prisma.invoice.create({
    data: {
      bookingId: input.booking_id || null,
      amount: input.amount,
      tax,
      total,
      paymentStatus: input.payment_status,
      paidAt,
    },
    include: {
      booking: {
        include: { vehicle: true, customer: true },
      },
    },
  });

  return {
    ...invoice,
    amount: parseFloat(invoice.amount.toString()),
    tax: parseFloat(invoice.tax.toString()),
    total: parseFloat(invoice.total.toString()),
  };
}

export async function payInvoiceService(id: number) {
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Invoice not found', 404);
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      paymentStatus: 'PAID',
      paidAt: new Date(),
    },
  });

  return {
    ...updated,
    amount: parseFloat(updated.amount.toString()),
    tax: parseFloat(updated.tax.toString()),
    total: parseFloat(updated.total.toString()),
  };
}
