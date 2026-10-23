import { Router } from 'express';
import { listInvoices, createInvoice, payInvoice } from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createInvoiceSchema } from './schema.js';

const router = Router();

router.use(authenticate, requireRole(['ADMIN', 'RECEPTIONIST']));

router.get('/', listInvoices);
router.post('/', validate({ body: createInvoiceSchema }), createInvoice);
router.patch('/:id/pay', payInvoice);

export default router;
