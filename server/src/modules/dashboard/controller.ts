import { Request, Response, NextFunction } from 'express';
import {
  getDashboardSummaryService,
  getDueTodayService,
  getExpiringService,
  getRevenueReportService,
  getServiceDistributionService,
} from './service.js';
import { sendSuccess } from '../../utils/response.js';

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
