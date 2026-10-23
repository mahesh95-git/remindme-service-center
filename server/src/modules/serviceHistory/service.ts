import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CreateServiceHistoryInput } from './schema.js';
import { EmailProvider } from '../../notifications/email.js';
import { NotificationPayload } from '../../notifications/adapter.js';
import { ENV } from '../../config/env.js';

export async function getServiceHistoryService(vehicleId: number) {
  const history = await prisma.serviceHistory.findMany({
    where: { vehicleId },
    orderBy: { serviceDate: 'desc' },
  });

  return history.map((h) => ({
    id: h.id,
    vehicle_id: h.vehicleId,
    service_type: h.serviceType,
    service_date: h.serviceDate.toISOString().split('T')[0],
    cost: parseFloat(h.cost.toString()),
    notes: h.notes,
    created_at: h.createdAt,
  }));
}

export async function createServiceHistoryService(vehicleId: number, input: CreateServiceHistoryInput) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { customer: true },
  });
  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }

  const servDate = new Date(input.service_date);
  const intervalDays = vehicle.serviceIntervalDays || 180;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create service history record
    const history = await tx.serviceHistory.create({
      data: {
        vehicleId,
        serviceType: input.service_type,
        serviceDate: servDate,
        cost: input.cost,
        notes: input.notes || null,
      },
    });

    // 2. Advance vehicle lastServiceDate and nextServiceDate
    const shouldUpdate =
      !vehicle.lastServiceDate || vehicle.lastServiceDate <= servDate;

    if (shouldUpdate) {
      const nextDate = new Date(servDate);
      nextDate.setDate(nextDate.getDate() + intervalDays);

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          lastServiceDate: servDate,
          nextServiceDate: nextDate,
        },
      });
    }

    return history;
  });

  let completionEmail: { sent: boolean; error?: string };
  if (!vehicle.customer.email) {
    completionEmail = { sent: false, error: 'Customer does not have an email address' };
  } else {
    const emailPayload: NotificationPayload = {
      to: vehicle.customer.email,
      recipientName: vehicle.customer.name,
      subject: `RemindMe Service Completed: ${input.service_type}`,
      message: `Your ${input.service_type} for ${vehicle.make} ${vehicle.model} (${vehicle.regNumber}) has been completed successfully. Thank you for choosing RemindMe.`,
      serviceType: input.service_type,
      vehicleReg: vehicle.regNumber,
      reminderType: 'SERVICE',
      dueDate: servDate.toISOString().split('T')[0],
      bookingUrl: `${ENV.CLIENT_URL}/book?reg=${encodeURIComponent(vehicle.regNumber)}`,
    };
    const emailResult = await new EmailProvider().send(emailPayload);
    completionEmail = emailResult.success ? { sent: true } : { sent: false, error: emailResult.error };
  }

  return {
    ...result,
    cost: parseFloat(result.cost.toString()),
    completionEmail,
  };
}
