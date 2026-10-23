import { Router } from 'express';
import {
  getVehicles,
  getVehicleById,
  lookupVehicle,
  createVehicle,
  registerVehicleWithCustomer,
  updateVehicle,
  deleteVehicle,
  sendManualReminder,
} from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createVehicleSchema, registerVehicleWithCustomerSchema, updateVehicleSchema, sendManualReminderSchema } from './schema.js';

const router = Router();

// Public vehicle lookup for booking slot page
router.get('/lookup/:regNumber', lookupVehicle);

// Protected routes for staff
router.get('/', authenticate, requireRole(['ADMIN', 'RECEPTIONIST']), getVehicles);
router.get('/:id', authenticate, requireRole(['ADMIN', 'RECEPTIONIST']), getVehicleById);
router.post('/', authenticate, requireRole(['ADMIN', 'RECEPTIONIST']), validate({ body: createVehicleSchema }), createVehicle);
router.post('/register', authenticate, requireRole(['ADMIN', 'RECEPTIONIST']), validate({ body: registerVehicleWithCustomerSchema }), registerVehicleWithCustomer);
router.put('/:id', authenticate, requireRole(['ADMIN', 'RECEPTIONIST']), validate({ body: updateVehicleSchema }), updateVehicle);
router.post('/:id/reminder', authenticate, requireRole(['ADMIN', 'RECEPTIONIST']), validate({ body: sendManualReminderSchema }), sendManualReminder);
router.delete('/:id', authenticate, requireRole(['ADMIN', 'RECEPTIONIST']), deleteVehicle);

export default router;
