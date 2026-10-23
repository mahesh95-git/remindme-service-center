import { Request, Response, NextFunction } from 'express';
import {
  getVehiclesService,
  getVehicleByIdService,
  lookupVehicleByRegService,
  createVehicleService,
  registerVehicleWithCustomerService,
  updateVehicleService,
  deleteVehicleService,
  sendManualReminderService,
} from './service.js';
import { sendSuccess } from '../../utils/response.js';

export async function getVehicles(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query.search as string | undefined;
    const vehicles = await getVehiclesService(search);
    return sendSuccess(res, vehicles);
  } catch (err) {
    next(err);
  }
}

export async function getVehicleById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const vehicle = await getVehicleByIdService(id);
    return sendSuccess(res, vehicle);
  } catch (err) {
    next(err);
  }
}

export async function lookupVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const regNumber = req.params.regNumber as string;
    const vehicle = await lookupVehicleByRegService(regNumber);
    return sendSuccess(res, vehicle);
  } catch (err) {
    next(err);
  }
}

export async function createVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicle = await createVehicleService(req.body);
    return sendSuccess(res, vehicle, 'Vehicle registered successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function registerVehicleWithCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await registerVehicleWithCustomerService(req.body);
    return sendSuccess(res, result, 'Customer and vehicle registered successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const vehicle = await updateVehicleService(id, req.body);
    return sendSuccess(res, vehicle, 'Vehicle updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const result = await deleteVehicleService(id);
    return sendSuccess(res, result, 'Vehicle removed successfully');
  } catch (err) {
    next(err);
  }
}

export async function sendManualReminder(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const result = await sendManualReminderService(id, req.body.reminder_type);
    return sendSuccess(res, result, 'Reminder email sent');
  } catch (err) {
    next(err);
  }
}
