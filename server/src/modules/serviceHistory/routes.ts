import { Router } from 'express';
import { getServiceHistory, createServiceHistory } from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createServiceHistorySchema } from './schema.js';

const router = Router({ mergeParams: true });

router.use(authenticate, requireRole(['ADMIN', 'RECEPTIONIST']));

router.get('/', getServiceHistory);
router.post('/', validate({ body: createServiceHistorySchema }), createServiceHistory);

export default router;
