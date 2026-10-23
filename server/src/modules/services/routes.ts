import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { sendSuccess } from '../../utils/response.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, services);
  } catch (error) {
    return next(error);
  }
});

export default router;
