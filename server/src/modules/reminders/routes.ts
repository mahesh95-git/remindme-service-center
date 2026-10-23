import { Router } from 'express';
import { listReminders, triggerReminders } from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole(['ADMIN', 'RECEPTIONIST']), listReminders);
router.post('/run', requireRole(['ADMIN']), triggerReminders);

export default router;
