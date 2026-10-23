import { Request, Response, NextFunction } from 'express';
import {
  listInvoicesService,
  createInvoiceService,
  payInvoiceService,
} from './service.js';
import { sendSuccess } from '../../utils/response.js';

export async function listInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    const invoices = await listInvoicesService(status);
    return sendSuccess(res, invoices);
  } catch (err) {
    next(err);
  }
}

export async function createInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await createInvoiceService(req.body);
    return sendSuccess(res, invoice, 'Invoice generated successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function payInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const invoice = await payInvoiceService(id);
    return sendSuccess(res, invoice, 'Invoice marked as paid');
  } catch (err) {
    next(err);
  }
}
