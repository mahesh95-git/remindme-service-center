import { Router } from 'express';
import { listInvoices, createInvoice, payInvoice } from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { OPERATIONAL_ROLES, requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createInvoiceSchema } from './schema.js';

const router = Router();

router.use(authenticate, requireRole(['ADMIN', ...OPERATIONAL_ROLES]));

router.get('/', listInvoices);
router.post('/', requireRole(OPERATIONAL_ROLES), validate({ body: createInvoiceSchema }), createInvoice);
router.patch('/:id/pay', requireRole(OPERATIONAL_ROLES), payInvoice);

export default router;
