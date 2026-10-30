import 'dotenv/config'
import {
  BookingStatus,
  PaymentStatus,
  PrismaClient,
  ReminderChannel,
  ReminderStatus,
  ReminderType,
} from '@prisma/client'

const prisma = new PrismaClient()
const day = 24 * 60 * 60 * 1000
const dateAt = (offset: number) => new Date(Date.now() + offset * day)
const dateKey = (offset: number) => dateAt(offset).toISOString().slice(0, 10)
const dateOnly = (offset: number) => new Date(`${dateKey(offset)}T00:00:00.000Z`)

const demoCustomers = [
  { name: 'Demo Ananya Rao', phone: '+91-9000000001', email: 'demo.customer.01@example.com', address: 'Indiranagar, Bengaluru' },
  { name: 'Demo Vikram Mehta', phone: '+91-9000000002', email: 'demo.customer.02@example.com', address: 'Koramangala, Bengaluru' },
  { name: 'Demo Sara Khan', phone: '+91-9000000003', email: 'demo.customer.03@example.com', address: 'Jubilee Hills, Hyderabad' },
  { name: 'Demo Arjun Nair', phone: '+91-9000000004', email: 'demo.customer.04@example.com', address: 'Whitefield, Bengaluru' },
  { name: 'Demo Mira Iyer', phone: '+91-9000000005', email: 'demo.customer.05@example.com', address: 'Adyar, Chennai' },
  { name: 'Demo Rohan Das', phone: '+91-9000000006', email: 'demo.customer.06@example.com', address: 'Salt Lake, Kolkata' },
]

const demoVehicles = [
  { regNumber: 'KA03DEMO01', make: 'Maruti Suzuki', model: 'Baleno', year: 2022 },
  { regNumber: 'KA05DEMO02', make: 'Hyundai', model: 'Creta', year: 2021 },
  { regNumber: 'TS09DEMO03', make: 'Honda', model: 'City', year: 2023 },
  { regNumber: 'KA53DEMO04', make: 'Tata', model: 'Nexon', year: 2022 },
  { regNumber: 'TN07DEMO05', make: 'Toyota', model: 'Innova Hycross', year: 2024 },
  { regNumber: 'WB06DEMO06', make: 'Kia', model: 'Seltos', year: 2020 },
]

const demoBookings = [
  { customer: 0, offset: -7, start: '09:00', service: 'Periodic maintenance', status: BookingStatus.COMPLETED, code: 'DEMO-BOOKING-01', amount: 7800 },
  { customer: 1, offset: -1, start: '10:00', service: 'Brake inspection', status: BookingStatus.COMPLETED, code: 'DEMO-BOOKING-02', amount: 3200 },
  { customer: 2, offset: 0, start: '11:00', service: 'Engine diagnostics', status: BookingStatus.CONFIRMED, code: 'DEMO-BOOKING-03' },
  { customer: 3, offset: 0, start: '14:00', service: 'Oil and filter change', status: BookingStatus.CONFIRMED, code: 'DEMO-BOOKING-04' },
  { customer: 4, offset: 1, start: '09:00', service: 'General service', status: BookingStatus.CONFIRMED, code: 'DEMO-BOOKING-05' },
  { customer: 5, offset: 4, start: '15:00', service: 'AC inspection', status: BookingStatus.CONFIRMED, code: 'DEMO-BOOKING-06' },
]

async function main() {
  const customers = []
  for (const customer of demoCustomers) {
    const existing = await prisma.customer.findFirst({ where: { phone: customer.phone } })
    customers.push(existing ?? await prisma.customer.create({ data: customer }))
  }

  const vehicles = []
  for (const [index, vehicle] of demoVehicles.entries()) {
    vehicles.push(await prisma.vehicle.upsert({
      where: { regNumber: vehicle.regNumber },
      update: {},
      create: {
        ...vehicle,
        customerId: customers[index].id,
        purchaseDate: dateOnly(-500),
        insuranceExpiry: dateAt(120),
        pucExpiry: dateAt(75),
        warrantyExpiry: dateAt(240),
        serviceIntervalDays: 180,
        lastServiceDate: dateAt(-190),
        nextServiceDate: dateAt(-10),
      },
    }))
  }

  for (const name of ['Periodic maintenance', 'Brake inspection', 'Engine diagnostics', 'Oil and filter change', 'General service', 'AC inspection']) {
    await prisma.service.upsert({ where: { name }, update: {}, create: { name } })
  }

  for (const [index, item] of demoBookings.entries()) {
    const vehicle = vehicles[item.customer]
    const customer = customers[item.customer]
    const slotHour = Number(item.start.slice(0, 2)) + 1
    const booking = await prisma.booking.upsert({
      where: { bookingCode: item.code },
      update: {
        bookingDate: dateOnly(item.offset),
        slotStart: item.start,
        slotEnd: `${String(slotHour).padStart(2, '0')}:00`,
        status: item.status,
      },
      create: {
        vehicleId: vehicle.id,
        customerId: customer.id,
        bookingDate: dateOnly(item.offset),
        slotStart: item.start,
        slotEnd: `${String(slotHour).padStart(2, '0')}:00`,
        contactName: customer.name,
        contactPhone: customer.phone,
        serviceType: item.service,
        status: item.status,
        bookingCode: item.code,
      },
    })

    if (item.status === BookingStatus.COMPLETED && item.amount) {
      const tax = Math.round(item.amount * 0.18)
      await prisma.invoice.upsert({
        where: { bookingId: booking.id },
        update: {},
        create: {
          bookingId: booking.id,
          amount: item.amount,
          tax,
          total: item.amount + tax,
          paymentStatus: index === 0 ? PaymentStatus.PAID : PaymentStatus.UNPAID,
          paidAt: index === 0 ? dateAt(-6) : null,
        },
      })
      const history = await prisma.serviceHistory.findFirst({ where: { vehicleId: vehicle.id, notes: `Demo seed: ${item.code}` } })
      if (!history) {
        await prisma.serviceHistory.create({
          data: {
            vehicleId: vehicle.id,
            serviceType: item.service,
            serviceDate: dateAt(item.offset),
            cost: item.amount,
            notes: `Demo seed: ${item.code}`,
          },
        })
      }
    }
  }

  const demoReminders = [
    { vehicle: 0, type: ReminderType.SERVICE, offset: 7, channel: ReminderChannel.EMAIL },
    { vehicle: 1, type: ReminderType.INSURANCE, offset: 15, channel: ReminderChannel.EMAIL },
    { vehicle: 2, type: ReminderType.PUC, offset: 1, channel: ReminderChannel.SMS },
    { vehicle: 3, type: ReminderType.WARRANTY, offset: 30, channel: ReminderChannel.EMAIL },
  ]
  for (const reminder of demoReminders) {
    const dueDate = dateOnly(reminder.offset)
    const existing = await prisma.reminder.findFirst({
      where: { vehicleId: vehicles[reminder.vehicle].id, type: reminder.type, dueDate, leadDays: 0 },
    })
    if (!existing) {
      await prisma.reminder.create({
        data: {
          vehicleId: vehicles[reminder.vehicle].id,
          type: reminder.type,
          dueDate,
          leadDays: 0,
          channel: reminder.channel,
          status: ReminderStatus.PENDING,
        },
      })
    }
  }

  console.log('Demo data ready:', JSON.stringify({ customers: customers.length, vehicles: vehicles.length, bookings: demoBookings.length, reminders: demoReminders.length }))
}

main()
  .catch((error) => {
    console.error('Unable to seed demo data:', error instanceof Error ? error.message : 'Unknown error')
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
