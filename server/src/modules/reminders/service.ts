import { prisma } from '../../config/prisma.js';
import { ENV } from '../../config/env.js';
import { EmailProvider } from '../../notifications/email.js';
import { NotificationPayload } from '../../notifications/adapter.js';
import { ReminderChannel, ReminderType } from '@prisma/client';

const emailProvider = new EmailProvider();

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
