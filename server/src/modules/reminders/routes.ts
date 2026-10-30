import { Router } from 'express';
import { listReminders, sendDuePeriodReminders, sendManualReminder, triggerReminders } from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { OPERATIONAL_ROLES, requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { sendDuePeriodRemindersSchema, sendManualReminderSchema } from './schema.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole(['ADMIN', ...OPERATIONAL_ROLES]), listReminders);
router.post('/manual', requireRole(['ADMIN', ...OPERATIONAL_ROLES]), validate({ body: sendManualReminderSchema }), sendManualReminder);
router.post('/due-period', requireRole(['ADMIN', ...OPERATIONAL_ROLES]), validate({ body: sendDuePeriodRemindersSchema }), sendDuePeriodReminders);
router.post('/run', requireRole(['ADMIN']), triggerReminders);

export default router;
