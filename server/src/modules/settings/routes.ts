import { Router } from 'express';
import { getSettings, updateSettings } from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { updateSlotConfigSchema } from './schema.js';

const router = Router();

router.use(authenticate, requireRole(['ADMIN']));

router.get('/', getSettings);
router.put('/', validate({ body: updateSlotConfigSchema }), updateSettings);

export default router;
