import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export type UserRole = 'ADMIN' | 'RECEPTIONIST';

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
