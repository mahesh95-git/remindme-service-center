import { Request, Response, NextFunction } from 'express';
import {
  getAvailableSlotsService,
  createBookingService,
  listBookingsService,
  updateBookingStatusService,
  rescheduleBookingService,
} from './service.js';
import { sendSuccess } from '../../utils/response.js';

export async function getAvailableSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const date = req.query.date as string;
    const result = await getAvailableSlotsService(date);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getBookingRescheduleSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const date = req.query.date as string;
    const id = parseInt(req.params.id as string, 10);
    const result = await getAvailableSlotsService(date, id);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function createBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await createBookingService(req.body);
    return sendSuccess(res, booking, 'Service slot booked successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function listBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      date: req.query.date as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    };
    const bookings = await listBookingsService(filters);
    return sendSuccess(res, bookings);
  } catch (err) {
    next(err);
  }
}

export async function updateBookingStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { status } = req.body;
    const booking = await updateBookingStatusService(id, status);
    return sendSuccess(res, booking, 'Booking status updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function rescheduleBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { booking_date, slot_start } = req.body;
    const booking = await rescheduleBookingService(id, booking_date, slot_start);
    return sendSuccess(res, booking, 'Booking rescheduled successfully');
  } catch (err) {
    next(err);
  }
}
