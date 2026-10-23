import { Request, Response, NextFunction } from 'express';
import { loginService, getMeService } from './service.js';
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
