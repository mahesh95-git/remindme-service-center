import { Router } from "express";
import {
  getAvailableSlots,
  getBookingRescheduleSlots,
  createBooking,
  listBookings,
  updateBookingStatus,
  rescheduleBooking,
  assignBookingStaff,
  completeBooking,
  getInvoiceUploadSignature,
} from "./controller.js";
import { authenticate } from "../../middleware/auth.js";
import { OPERATIONAL_ROLES, requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  getSlotsQuerySchema,
  createBookingSchema,
  updateBookingStatusSchema,
  rescheduleBookingSchema,
  bookingSlotsQuerySchema,
  listBookingsQuerySchema,
  assignBookingStaffSchema,
  completeBookingSchema,
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
  requireRole(["ADMIN", ...OPERATIONAL_ROLES]),
  validate({ query: listBookingsQuerySchema }),
  listBookings,
);
router.get(
  "/:id/slots",
  authenticate,
  requireRole(OPERATIONAL_ROLES),
  validate({ query: bookingSlotsQuerySchema }),
  getBookingRescheduleSlots,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole(OPERATIONAL_ROLES),
  validate({ body: updateBookingStatusSchema }),
  updateBookingStatus,
);
router.patch(
  "/:id/complete",
  authenticate,
  requireRole(OPERATIONAL_ROLES),
  validate({ body: completeBookingSchema }),
  completeBooking,
);
router.post(
  "/invoice-upload-signature",
  authenticate,
  requireRole(OPERATIONAL_ROLES),
  getInvoiceUploadSignature,
);
router.patch(
  "/:id/schedule",
  authenticate,
  requireRole(OPERATIONAL_ROLES),
  validate({ body: rescheduleBookingSchema }),
  rescheduleBooking,
);
router.patch(
  "/:id/assignee",
  authenticate,
  requireRole(['ADMIN']),
  validate({ body: assignBookingStaffSchema }),
  assignBookingStaff,
);

export default router;
