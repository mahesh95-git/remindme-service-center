import { Router } from 'express';
import {
  getSummary,
  getDueToday,
  getExpiring,
  getRevenue,
  getServiceDistribution,
  getServiceActivity,
  getRevenueActivity,
  getDuePeriod,
} from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { OPERATIONAL_ROLES, requireRole } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, requireRole(['ADMIN', ...OPERATIONAL_ROLES]));

router.get('/summary', getSummary);
router.get('/service-activity', getServiceActivity);
router.get('/revenue-activity', getRevenueActivity);
router.get('/due-today', getDueToday);
router.get('/due-period', getDuePeriod);
router.get('/expiring', getExpiring);
router.get('/revenue', getRevenue);
router.get('/service-distribution', getServiceDistribution);
// Backward compatibility alias for dashboard widget
router.get('/jobs-per-mechanic', getServiceDistribution);

export default router;
