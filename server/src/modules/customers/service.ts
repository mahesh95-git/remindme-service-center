import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CreateCustomerInput, UpdateCustomerInput } from './schema.js';

export async function getCustomersService(search?: string) {
  const where: any = {};
  if (search) {
    const s = search.trim();
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      vehicles: {
        include: {
          serviceHistory: {
            orderBy: { serviceDate: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return customers.map((c) => {
    let lastVisit: Date | null = null;
    for (const v of c.vehicles) {
      if (v.serviceHistory.length > 0) {
        const d = v.serviceHistory[0].serviceDate;
        if (!lastVisit || d > lastVisit) {
          lastVisit = d;
        }
      }
    }

    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      created_at: c.createdAt,
      vehicles_count: c.vehicles.length,
      last_visit: lastVisit ? lastVisit.toISOString().split('T')[0] : null,
      vehicles: c.vehicles.map((v) => ({
        id: v.id,
        reg_number: v.regNumber,
        make: v.make,
        model: v.model,
        year: v.year,
        next_service_date: v.nextServiceDate ? v.nextServiceDate.toISOString().split('T')[0] : null,
      })),
    };
  });
}

export async function getCustomerByIdService(id: number) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      vehicles: {
        include: {
          serviceHistory: {
            orderBy: { serviceDate: 'desc' },
          },
        },
      },
    },
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  return {
    ...customer,
    vehicles_count: customer.vehicles.length,
  };
}

export async function createCustomerService(input: CreateCustomerInput) {
  const customer = await prisma.customer.create({
    data: {
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
    },
  });
  return customer;
}

export async function updateCustomerService(id: number, input: UpdateCustomerInput) {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Customer not found', 404);
  }

  const data: any = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.phone !== undefined) data.phone = input.phone.trim();
  if (input.email !== undefined) data.email = input.email?.trim() || null;
  if (input.address !== undefined) data.address = input.address?.trim() || null;

  const updated = await prisma.customer.update({
    where: { id },
    data,
  });
  return updated;
}

export async function deleteCustomerService(id: number) {
  const vehicleCount = await prisma.vehicle.count({ where: { customerId: id } });
  if (vehicleCount > 0) {
    throw new AppError(
      `Cannot delete customer with ${vehicleCount} active registered vehicle(s). Remove vehicles first.`,
      400
    );
  }

  await prisma.customer.delete({ where: { id } });
  return { id };
}
