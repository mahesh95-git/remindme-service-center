import { Request, Response, NextFunction } from 'express';
import { getServiceHistoryService, createServiceHistoryService } from './service.js';
import { sendSuccess } from '../../utils/response.js';

export async function getServiceHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicleId = parseInt(req.params.id as string, 10);
    const history = await getServiceHistoryService(vehicleId);
    return sendSuccess(res, history);
  } catch (err) {
    next(err);
  }
}

export async function createServiceHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicleId = parseInt(req.params.id as string, 10);
    const result = await createServiceHistoryService(vehicleId, req.body);
    return sendSuccess(res, result, 'Service history recorded and vehicle updated', 201);
  } catch (err) {
    next(err);
  }
}
