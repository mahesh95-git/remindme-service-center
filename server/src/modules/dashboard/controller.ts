import { Request, Response, NextFunction } from 'express';
import {
  getDashboardSummaryService,
  getDueTodayService,
  getExpiringService,
  getRevenueReportService,
  getServiceDistributionService,
  getServiceActivityService,
  getRevenueActivityService,
  getDuePeriodService,
} from './service.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';

function reportRange(req: Request) {
  const from = String(req.query.from ?? '');
  const to = String(req.query.to ?? '');
  const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) && new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value);
  if (!isDate(from) || !isDate(to) || from > to) throw new AppError('A valid report date range is required', 400);
  return { from, to };
}

export async function getServiceActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = reportRange(req);
    const records = await getServiceActivityService(from, to);
    return sendSuccess(res, records);
  } catch (err) {
    next(err);
  }
}

export async function getRevenueActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = reportRange(req);
    const revenue = await getRevenueActivityService(from, to);
    return sendSuccess(res, revenue);
  } catch (err) {
    next(err);
  }
}

export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await getDashboardSummaryService();
    return sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
}

export async function getDueToday(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await getDueTodayService();
    return sendSuccess(res, list);
  } catch (err) {
    next(err);
  }
}

export async function getDuePeriod(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = reportRange(req);
    const list = await getDuePeriodService(from, to);
    return sendSuccess(res, list);
  } catch (err) {
    next(err);
  }
}

export async function getExpiring(req: Request, res: Response, next: NextFunction) {
  try {
    const type = (req.query.type as any) || 'insurance';
    const list = await getExpiringService(type);
    return sendSuccess(res, list);
  } catch (err) {
    next(err);
  }
}

export async function getRevenue(req: Request, res: Response, next: NextFunction) {
  try {
    const revenue = await getRevenueReportService();
    return sendSuccess(res, revenue);
  } catch (err) {
    next(err);
  }
}

export async function getServiceDistribution(req: Request, res: Response, next: NextFunction) {
  try {
    const dist = await getServiceDistributionService();
    return sendSuccess(res, dist);
  } catch (err) {
    next(err);
  }
}
