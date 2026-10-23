import { Request, Response, NextFunction } from 'express';
import { getSettingsService, updateSlotConfigService } from './service.js';
import { sendSuccess } from '../../utils/response.js';

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await getSettingsService();
    return sendSuccess(res, settings);
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await updateSlotConfigService(req.body);
    return sendSuccess(res, updated, 'Settings saved successfully');
  } catch (err) {
    next(err);
  }
}
