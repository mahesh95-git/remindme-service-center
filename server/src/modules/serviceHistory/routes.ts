import { Router } from 'express';
import { getServiceHistory, createServiceHistory } from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { OPERATIONAL_ROLES, requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createServiceHistorySchema } from './schema.js';

const router = Router({ mergeParams: true });

router.use(authenticate, requireRole(['ADMIN', ...OPERATIONAL_ROLES]));

router.get('/', getServiceHistory);
router.post('/', requireRole(OPERATIONAL_ROLES), validate({ body: createServiceHistorySchema }), createServiceHistory);

export default router;
