import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createCustomerSchema, updateCustomerSchema } from './schema.js';

const router = Router();

router.use(authenticate, requireRole(['ADMIN', 'RECEPTIONIST']));

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', validate({ body: createCustomerSchema }), createCustomer);
router.put('/:id', validate({ body: updateCustomerSchema }), updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
