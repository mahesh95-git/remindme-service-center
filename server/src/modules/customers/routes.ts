import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { OPERATIONAL_ROLES, requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createCustomerSchema, updateCustomerSchema } from './schema.js';

const router = Router();

router.use(authenticate, requireRole(['ADMIN', ...OPERATIONAL_ROLES]));

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', requireRole(OPERATIONAL_ROLES), validate({ body: createCustomerSchema }), createCustomer);
router.put('/:id', requireRole(OPERATIONAL_ROLES), validate({ body: updateCustomerSchema }), updateCustomer);
router.delete('/:id', requireRole(['ADMIN']), deleteCustomer);

export default router;
