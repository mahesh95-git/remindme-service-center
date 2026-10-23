import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
}

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
  return res.status(statusCode).json(body);
}

export function sendError(res: Response, message: string, statusCode = 400, errors?: any): Response {
  const body: ApiResponse = {
    success: false,
    message,
    ...(errors ? { errors } : {}),
  };
  return res.status(statusCode).json(body);
}
