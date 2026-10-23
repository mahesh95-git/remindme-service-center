import bcrypt from 'bcrypt';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CreateUserInput, UpdateUserInput } from './schema.js';

export async function getUsersService() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { id: 'asc' },
  });
  return users;
}

export async function createUserService(input: CreateUserInput) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('A user with this email already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash: hashedPassword,
      role: input.role,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  return user;
}

export async function updateUserService(id: number, input: UpdateUserInput) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('User not found', 404);
  }

  if (input.email) {
    const email = input.email.toLowerCase().trim();
    const dup = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });
    if (dup) {
      throw new AppError('Another user already has this email', 400);
    }
  }

  const data: any = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.email !== undefined) data.email = input.email.toLowerCase().trim();
  if (input.role !== undefined) data.role = input.role;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.password) {
    data.passwordHash = await bcrypt.hash(input.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return updated;
}

export async function deleteUserService(id: number, actorId: number) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('User not found', 404);
  }

  if (existing.id === actorId) {
    throw new AppError('You cannot remove your own account', 400);
  }

  if (existing.role === 'ADMIN' && existing.isActive) {
    const activeAdminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
    if (activeAdminCount <= 1) {
      throw new AppError('The last active administrator cannot be removed', 400);
    }
  }

  await prisma.user.delete({ where: { id } });
  return { id };
}
