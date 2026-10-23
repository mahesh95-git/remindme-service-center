import { Router } from "express";
import {
  getAvailableSlots,
  getBookingRescheduleSlots,
  createBooking,
  listBookings,
  updateBookingStatus,
  rescheduleBooking,
} from "./controller.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  getSlotsQuerySchema,
  createBookingSchema,
  updateBookingStatusSchema,
  rescheduleBookingSchema,
  bookingSlotsQuerySchema,
  listBookingsQuerySchema,
} from "./schema.js";

const router = Router();

// Public endpoints
router.get(
  "/slots",
  validate({ query: getSlotsQuerySchema }),
  getAvailableSlots,
);
router.post("/", validate({ body: createBookingSchema }), createBooking);

// Protected endpoints for staff
router.get(
  "/",
  authenticate,
  requireRole(["ADMIN", "RECEPTIONIST"]),
  validate({ query: listBookingsQuerySchema }),
  listBookings,
);
router.get(
  "/:id/slots",
  authenticate,
  requireRole(["ADMIN", "RECEPTIONIST"]),
  validate({ query: bookingSlotsQuerySchema }),
  getBookingRescheduleSlots,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole(["ADMIN", "RECEPTIONIST"]),
  validate({ body: updateBookingStatusSchema }),
  updateBookingStatus,
);
router.patch(
  "/:id/schedule",
  authenticate,
  requireRole(["ADMIN", "RECEPTIONIST"]),
  validate({ body: rescheduleBookingSchema }),
  rescheduleBooking,
);

export default router;
