import { Request, Response, NextFunction } from 'express';
import {
  getCustomersService,
  getCustomerByIdService,
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
} from './service.js';
import { sendSuccess } from '../../utils/response.js';

export async function getCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query.search as string | undefined;
    const customers = await getCustomersService(search);
    return sendSuccess(res, customers);
  } catch (err) {
    next(err);
  }
}

export async function getCustomerById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const customer = await getCustomerByIdService(id);
    return sendSuccess(res, customer);
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await createCustomerService(req.body);
    return sendSuccess(res, customer, 'Customer created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const customer = await updateCustomerService(id, req.body);
    return sendSuccess(res, customer, 'Customer updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const result = await deleteCustomerService(id);
    return sendSuccess(res, result, 'Customer deleted successfully');
  } catch (err) {
    next(err);
  }
}
