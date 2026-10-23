import { Router } from 'express';
import { login, getMe } from './controller.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema } from './schema.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.post('/login', validate({ body: loginSchema }), login);
router.get('/me', authenticate, getMe);

export default router;
