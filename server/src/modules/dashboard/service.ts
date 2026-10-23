import { prisma } from '../../config/prisma.js';

export async function getDashboardSummaryService() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const dayStart = new Date(`${todayStr}T00:00:00.000Z`);
  const dayEnd = new Date(`${todayStr}T23:59:59.999Z`);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    registeredVehicles,
    activeCustomers,
    bookingsTodayAll,
    activeStaff,
    revenueMonthAgg,
    servicesMonth,
    remindersCount,
    bookingsThisMonth,
    servicesThisMonth,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.customer.count(),
    prisma.booking.findMany({
      where: {
        bookingDate: { gte: dayStart, lte: dayEnd },
      },
      select: { status: true },
    }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.serviceHistory.count({
      where: {
        serviceDate: { gte: startOfMonth },
      },
    }),
    prisma.reminder.count({
      where: {
        status: { in: ['PENDING', 'SENT'] },
      },
    }),
    prisma.booking.findMany({
      where: { bookingDate: { gte: startOfMonth } },
      select: { bookingDate: true },
    }),
    prisma.serviceHistory.findMany({
      where: { serviceDate: { gte: startOfMonth } },
      select: { serviceDate: true },
    }),
  ]);

  const confirmedBookings = bookingsTodayAll.filter((b) => b.status === 'CONFIRMED').length;
  const completedBookings = bookingsTodayAll.filter((b) => b.status === 'COMPLETED').length;

  const revTotal = revenueMonthAgg._sum.total ? parseFloat(revenueMonthAgg._sum.total.toString()) : 0;
  const invCount = revenueMonthAgg._count.id;
  const avgInvoice = invCount > 0 ? Math.round(revTotal / invCount) : 0;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthlyBookingTrend = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return {
      day,
      bookings: bookingsThisMonth.filter((booking) => booking.bookingDate.getDate() === day).length,
      services: servicesThisMonth.filter((service) => service.serviceDate.getDate() === day).length,
    };
  });

  return {
    registeredVehicles,
    activeCustomers,
    bookingsToday: {
      total: bookingsTodayAll.length,
      confirmed: confirmedBookings,
      completed: completedBookings,
    },
    activeStaff,
    revenueThisMonth: revTotal,
    servicesCompletedMonth: servicesMonth,
    averageInvoice: avgInvoice,
    remindersCount,
    monthlyBookingTrend,
  };
}

export async function getDueTodayService() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const dayEnd = new Date(`${todayStr}T23:59:59.999Z`);

  const vehicles = await prisma.vehicle.findMany({
    where: {
      nextServiceDate: {
        lte: dayEnd,
      },
    },
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
    orderBy: { nextServiceDate: 'asc' },
    take: 20,
  });

  return vehicles.map((v) => ({
    id: v.id,
    reg_number: v.regNumber,
    make: v.make,
    model: v.model,
    next_service_date: v.nextServiceDate ? v.nextServiceDate.toISOString().split('T')[0] : null,
    customer_name: v.customer.name,
    customer_phone: v.customer.phone,
  }));
}

export async function getExpiringService(type: 'insurance' | 'puc' | 'warranty' | 'service') {
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const fieldMap: Record<string, 'insuranceExpiry' | 'pucExpiry' | 'warrantyExpiry' | 'nextServiceDate'> = {
    insurance: 'insuranceExpiry',
    puc: 'pucExpiry',
    warranty: 'warrantyExpiry',
    service: 'nextServiceDate',
  };

  const field = fieldMap[type] || 'insuranceExpiry';

  const vehicles = await prisma.vehicle.findMany({
    where: {
      [field]: {
        gte: now,
        lte: in30Days,
      },
    },
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
          email: true,
        },
      },
    },
    orderBy: { [field]: 'asc' },
    take: 30,
  });

  return vehicles.map((v) => {
    const d = v[field] as Date | null;
    const daysRemaining = d ? Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return {
      id: v.id,
      reg_number: v.regNumber,
      make: v.make,
      model: v.model,
      expiry_date: d ? d.toISOString().split('T')[0] : null,
      customer_name: v.customer.name,
      customer_phone: v.customer.phone,
      customer_email: v.customer.email,
      days_remaining: daysRemaining,
    };
  });
}

export async function getRevenueReportService() {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result: Array<{ day: string; date: string; value: number }> = [];

  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const agg = await prisma.invoice.aggregate({
      _sum: { total: true },
      where: {
        paymentStatus: 'PAID',
        paidAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    const val = agg._sum.total ? parseFloat(agg._sum.total.toString()) : 0;
    result.push({
      day: daysOfWeek[d.getDay()],
      date: dateStr,
      value: val,
    });
  }

  return result;
}

export async function getServiceDistributionService() {
  const groups = await prisma.booking.groupBy({
    by: ['serviceType'],
    _count: { id: true },
  });

  return groups.map((g) => ({
    name: g.serviceType,
    count: g._count.id,
  }));
}
