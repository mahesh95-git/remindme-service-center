import { Request, Response, NextFunction } from 'express';
import { listRemindersService, runReminderEngine, sendDuePeriodRemindersService, sendManualReminderService } from './service.js';
import { sendSuccess } from '../../utils/response.js';

export async function listReminders(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      type: req.query.type as string | undefined,
      channel: req.query.channel as string | undefined,
      status: req.query.status as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
    };
    const result = await listRemindersService(filters);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function triggerReminders(req: Request, res: Response, next: NextFunction) {
  try {
    const { targetDate, leadDays } = req.body || {};
    const result = await runReminderEngine({ targetDate, leadDays });
    return sendSuccess(res, result, 'Reminder engine execution completed');
  } catch (err) {
    next(err);
  }
}

export async function sendManualReminder(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await sendManualReminderService({
      vehicleId: req.body.vehicleId,
      reminderType: req.body.reminderType,
      channel: req.body.channel,
      message: req.body.message,
    });
    return sendSuccess(res, result, 'Custom reminder sent');
  } catch (err) {
    next(err);
  }
}

export async function sendDuePeriodReminders(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await sendDuePeriodRemindersService({
      from: req.body.from,
      to: req.body.to,
    });
    return sendSuccess(res, result, 'Due reminders processed');
  } catch (err) {
    next(err);
  }
}
