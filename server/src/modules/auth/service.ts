import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import { ENV } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';
import { EmailProvider } from '../../notifications/email.js';
import { ForgotPasswordInput, LoginInput, ResetPasswordInput } from './schema.js';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export async function loginService(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('User account is deactivated. Please contact administrator.', 403);
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '7d' });

  return {
    token,
    user: payload,
  };
}

export async function getMeService(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

export async function forgotPasswordService(input: ForgotPasswordInput) {
    const email = input.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await prisma.user.update({
        where: { id: user.id },
        data: { resetTokenHash: tokenHash, resetTokenExpiresAt: expiresAt },
      });

      const resetUrl = `${ENV.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`;
      const result = await new EmailProvider().sendPasswordReset(user.email, user.name, resetUrl);
      if (!result.success) {
        throw new AppError('Unable to send password reset email. Please try again later.', 503);
      }
    }

    return { message: 'If an account exists for that email, a password reset link has been sent.' };
  }

export async function resetPasswordService(input: ResetPasswordInput) {
    const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');
    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new AppError('This password reset link is invalid or has expired.', 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(input.password, 10),
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });
  }
