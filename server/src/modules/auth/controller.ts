import { Request, Response, NextFunction } from 'express';
import { forgotPasswordService, getMeService, loginService, resetPasswordService } from './service.js';
import { sendSuccess } from '../../utils/response.js';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await loginService(req.body);
    return sendSuccess(res, result, 'Logged in successfully');
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getMeService(req.user!.id);
    return sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await forgotPasswordService(req.body);
    return sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await resetPasswordService(req.body);
    return sendSuccess(res, null, 'Password reset successfully');
  } catch (err) {
    next(err);
  }
}
