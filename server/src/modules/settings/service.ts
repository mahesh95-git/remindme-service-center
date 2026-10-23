import { prisma } from '../../config/prisma.js';

export async function getSettingsService() {
  const config = await prisma.slotConfig.findFirst();
  const slotConfig = config || {
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    slotDurationMinutes: 60,
    maxBookingsPerSlot: 4,
  };

  return {
    business: {
      name: 'Autocare Service Center',
      phone: '+91 22 4000 8800',
      email: 'service@autocare.in',
      defaultServiceIntervalDays: 180,
    },
    slotConfig: {
      working_hours_start: slotConfig.workingHoursStart.slice(0, 5),
      working_hours_end: slotConfig.workingHoursEnd.slice(0, 5),
      slot_duration_minutes: slotConfig.slotDurationMinutes,
      max_bookings_per_slot: slotConfig.maxBookingsPerSlot,
    },
    reminderConfig: {
      leadDays: [30, 15, 7, 1],
      automatedRemindersEnabled: true,
      channels: ['Email', 'SMS', 'WhatsApp', 'In-app'],
    },
  };
}

export async function updateSlotConfigService(input: {
  working_hours_start?: string;
  working_hours_end?: string;
  slot_duration_minutes?: number;
  max_bookings_per_slot?: number;
}) {
  const existing = await prisma.slotConfig.findFirst();

  const data: any = {};
  if (input.working_hours_start) data.workingHoursStart = input.working_hours_start.slice(0, 5);
  if (input.working_hours_end) data.workingHoursEnd = input.working_hours_end.slice(0, 5);
  if (input.slot_duration_minutes !== undefined) data.slotDurationMinutes = input.slot_duration_minutes;
  if (input.max_bookings_per_slot !== undefined) data.maxBookingsPerSlot = input.max_bookings_per_slot;

  if (existing) {
    return await prisma.slotConfig.update({
      where: { id: existing.id },
      data,
    });
  } else {
    return await prisma.slotConfig.create({
      data: {
        workingHoursStart: input.working_hours_start?.slice(0, 5) || '09:00',
        workingHoursEnd: input.working_hours_end?.slice(0, 5) || '18:00',
        slotDurationMinutes: input.slot_duration_minutes || 60,
        maxBookingsPerSlot: input.max_bookings_per_slot || 4,
      },
    });
  }
}
