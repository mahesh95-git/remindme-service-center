import { prisma } from '../../config/prisma.js';
import { ENV } from '../../config/env.js';
import { EmailProvider } from '../../notifications/email.js';
import { SmsProvider } from '../../notifications/sms.js';
import { WhatsAppProvider } from '../../notifications/whatsapp.js';
import { NotificationPayload } from '../../notifications/adapter.js';
import { ReminderChannel, ReminderType } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler.js';
import { getDuePeriodService } from '../dashboard/service.js';

const emailProvider = new EmailProvider();
const smsProvider = new SmsProvider();
const whatsappProvider = new WhatsAppProvider();

export async function listRemindersService(filters: {
  type?: string;
  channel?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (filters.type) where.type = filters.type as ReminderType;
  if (filters.channel) where.channel = filters.channel as ReminderChannel;
  if (filters.status) where.status = filters.status as any;

  const [items, total] = await Promise.all([
    prisma.reminder.findMany({
      where,
      include: {
        vehicle: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.reminder.count({ where }),
  ]);

  return {
    items: items.map((r) => ({
      id: r.id,
      vehicle_id: r.vehicleId,
      type: r.type,
      due_date: r.dueDate.toISOString().split('T')[0],
      lead_days: r.leadDays,
      channel: r.channel,
      status: r.status,
      sent_at: r.sentAt,
      error_message: r.errorMessage,
      created_at: r.createdAt,
      reg_number: r.vehicle.regNumber,
      make: r.vehicle.make,
      model: r.vehicle.model,
      customer_name: r.vehicle.customer.name,
      customer_phone: r.vehicle.customer.phone,
      customer_email: r.vehicle.customer.email,
    })),
    total,
  };
}

export async function runReminderEngine(options?: {
  targetDate?: string;
  leadDays?: number[];
}) {
  const baseDate = options?.targetDate ? new Date(options.targetDate) : new Date();
  const leadTimes = options?.leadDays || ENV.REMINDER_LEAD_DAYS;
  const results = {
    totalChecked: 0,
    totalCreated: 0,
    totalSent: 0,
    totalFailed: 0,
    totalSkipped: 0,
    createdReminders: [] as any[],
  };

  const reminderTypes: Array<{
    type: ReminderType;
    field: 'nextServiceDate' | 'insuranceExpiry' | 'pucExpiry' | 'warrantyExpiry';
    label: string;
  }> = [
    { type: 'SERVICE', field: 'nextServiceDate', label: 'Periodic Car Service' },
    { type: 'INSURANCE', field: 'insuranceExpiry', label: 'Insurance Policy' },
    { type: 'PUC', field: 'pucExpiry', label: 'PUC Certificate' },
    { type: 'WARRANTY', field: 'warrantyExpiry', label: 'Vehicle Warranty' },
  ];

  for (const lead of leadTimes) {
    const checkDate = new Date(baseDate);
    checkDate.setDate(checkDate.getDate() + lead);
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    for (const item of reminderTypes) {
      const vehicles = await prisma.vehicle.findMany({
        where: {
          [item.field]: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        include: {
          customer: true,
        },
      });

      results.totalChecked += vehicles.length;

      for (const vehicle of vehicles) {
        // Idempotency: check if reminder already sent for vehicleId + type + dueDate (same day) + leadDays
        const existing = await prisma.reminder.findFirst({
          where: {
            vehicleId: vehicle.id,
            type: item.type,
            leadDays: lead,
            dueDate: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        });

        if (existing) {
          continue;
        }

        if (!vehicle.customer.email) {
          results.totalSkipped++;
          continue;
        }

        const bookingUrl = `${ENV.CLIENT_URL}/book?reg=${encodeURIComponent(vehicle.regNumber)}`;
        const leadStr = lead === 1 ? 'tomorrow (1 day)' : `in ${lead} days`;
        const msg = `Dear ${vehicle.customer.name}, your ${vehicle.make} ${vehicle.model} (${vehicle.regNumber}) ${item.label} is due ${leadStr} on ${dateStr}.`;

        const payload: NotificationPayload = {
          to: vehicle.customer.phone,
          recipientName: vehicle.customer.name,
          message: msg,
          serviceType: item.label,
          vehicleReg: vehicle.regNumber,
          reminderType: item.type,
          dueDate: dateStr,
          bookingUrl,
        };

        const channel: ReminderChannel = 'EMAIL';
        {
          let status: 'SENT' | 'FAILED' = 'SENT';
          let errorMsg: string | null = null;

          try {
            const res = await emailProvider.send({
              ...payload,
              to: vehicle.customer.email,
            });
            if (!res.success) {
              status = 'FAILED';
              errorMsg = res.error || 'Email error';
            }
          } catch (err: any) {
            status = 'FAILED';
            errorMsg = err.message;
          }

          const reminder = await prisma.reminder.create({
            data: {
              vehicleId: vehicle.id,
              type: item.type,
              dueDate: dayStart,
              leadDays: lead,
              channel,
              status,
              sentAt: status === 'SENT' ? new Date() : null,
              errorMessage: errorMsg,
            },
          });

          results.totalCreated++;
          if (status === 'SENT') results.totalSent++;
          else results.totalFailed++;
          results.createdReminders.push(reminder);
        }
      }
    }
  }

  return results;
}

export async function sendManualReminderService(input: {
  vehicleId: number;
  reminderType: ReminderType;
  channel: 'SMS' | 'EMAIL' | 'WHATSAPP';
  message: string;
}) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: input.vehicleId },
    include: { customer: true },
  });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  const recipient = input.channel === 'EMAIL' ? vehicle.customer.email : vehicle.customer.phone;
  if (!recipient) {
    throw new AppError(
      input.channel === 'EMAIL'
        ? 'Customer does not have an email address'
        : 'Customer does not have a phone number',
      400,
    );
  }

  const dueDate = new Date();
  const payload: NotificationPayload = {
    to: recipient,
    recipientName: vehicle.customer.name,
    subject: 'RemindMe custom reminder',
    message: input.message,
    serviceType: 'Custom reminder',
    vehicleReg: vehicle.regNumber,
    reminderType: input.reminderType,
    dueDate: dueDate.toISOString().split('T')[0],
    bookingUrl: `${ENV.CLIENT_URL}/book?reg=${encodeURIComponent(vehicle.regNumber)}`,
  };
  const provider = {
    EMAIL: emailProvider,
    SMS: smsProvider,
    WHATSAPP: whatsappProvider,
  }[input.channel];

  let result;
  try {
    result = await provider.send(payload);
  } catch (error) {
    result = { success: false, error: error instanceof Error ? error.message : 'Notification provider error' };
  }

  const reminder = await prisma.reminder.create({
    data: {
      vehicleId: input.vehicleId,
      type: input.reminderType,
      dueDate,
      leadDays: 0,
      channel: input.channel as ReminderChannel,
      status: result.success ? 'SENT' : 'FAILED',
      sentAt: result.success ? new Date() : null,
      errorMessage: result.error || null,
    },
  });

  if (!result.success) {
    throw new AppError(result.error || 'Unable to send reminder', 502);
  }

  return { id: reminder.id, status: reminder.status, recipient, channel: input.channel };
}

export async function sendDuePeriodRemindersService(input: { from: string; to: string }) {
  const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) && new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value);
  if (!isDate(input.from) || !isDate(input.to) || input.from > input.to) {
    throw new AppError('A valid reminder date range is required', 400);
  }
  const dueItems = await getDuePeriodService(input.from, input.to);
  const result = { total: dueItems.length, sent: 0, skipped: 0, failed: 0 };

  for (const item of dueItems) {
    if (!item.customer_email) {
      result.skipped++;
      continue;
    }

    const label = {
      SERVICE: 'periodic service',
      INSURANCE: 'insurance',
      PUC: 'PUC certificate',
      WARRANTY: 'vehicle warranty',
    }[item.due_type];
    const message = `Dear ${item.customer_name}, your ${item.make} ${item.model} (${item.reg_number}) has a ${label} due on ${item.due_date}. Please contact us to arrange it.`;
    let status: 'SENT' | 'FAILED' = 'SENT';
    let errorMessage: string | null = null;

    try {
      const response = await emailProvider.send({
        to: item.customer_email,
        recipientName: item.customer_name,
        message,
        serviceType: label,
        vehicleReg: item.reg_number,
        reminderType: item.due_type,
        dueDate: item.due_date,
        bookingUrl: `${ENV.CLIENT_URL}/book?reg=${encodeURIComponent(item.reg_number)}`,
      });
      if (!response.success) {
        status = 'FAILED';
        errorMessage = response.error || 'Email error';
      }
    } catch (error) {
      status = 'FAILED';
      errorMessage = error instanceof Error ? error.message : 'Email provider error';
    }

    await prisma.reminder.create({
      data: {
        vehicleId: item.id,
        type: item.due_type,
        dueDate: new Date(`${item.due_date}T00:00:00.000Z`),
        leadDays: 0,
        channel: 'EMAIL',
        status,
        sentAt: status === 'SENT' ? new Date() : null,
        errorMessage,
      },
    });

    if (status === 'SENT') result.sent++;
    else result.failed++;
  }

  return result;
}
