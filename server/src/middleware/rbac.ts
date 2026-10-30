import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import type { UserRole } from './auth.js';

export const OPERATIONAL_ROLES: UserRole[] = ['RECEPTIONIST', 'SERVICE', 'DOCUMENTS', 'PUC'];

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, `Forbidden: Requires one of [${allowedRoles.join(', ')}] role`, 403);
    }

    next();
  };
}
