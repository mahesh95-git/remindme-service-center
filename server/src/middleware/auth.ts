import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { sendError } from '../utils/response.js';
import { prisma } from '../config/prisma.js';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'SERVICE' | 'DOCUMENTS' | 'PUC';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication token missing or invalid', 401);
  }

  const token = authHeader.split(' ')[1];
  let decoded: AuthUser;
  try {
    decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthUser;
  } catch (error) {
    return sendError(res, 'Invalid or expired token', 401);
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive) {
      return sendError(res, 'This account is no longer active. Please contact an administrator.', 401);
    }
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    return next();
  } catch (error) {
    return next(error);
  }
}
