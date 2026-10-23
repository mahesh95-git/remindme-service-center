import { Router } from 'express';
import {
  getSummary,
  getDueToday,
  getExpiring,
  getRevenue,
  getServiceDistribution,
} from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, requireRole(['ADMIN', 'RECEPTIONIST']));

router.get('/summary', getSummary);
router.get('/due-today', getDueToday);
router.get('/expiring', getExpiring);
router.get('/revenue', getRevenue);
router.get('/service-distribution', getServiceDistribution);
// Backward compatibility alias for dashboard widget
router.get('/jobs-per-mechanic', getServiceDistribution);

export default router;
