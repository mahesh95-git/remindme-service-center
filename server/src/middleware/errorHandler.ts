import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  statusCode: number;
  errors?: any;

  constructor(message: string, statusCode = 400, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validation failed', 400, formatted);
  }

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  logger.error('Unhandled Server Error:', err);
  return sendError(res, err.message || 'Internal server error', 500);
}
