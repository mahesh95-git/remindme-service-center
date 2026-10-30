import { Router } from 'express';
import { forgotPassword, getMe, login, resetPassword } from './controller.js';
import { validate } from '../../middleware/validate.js';
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from './schema.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.post('/login', validate({ body: loginSchema }), login);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), resetPassword);
router.get('/me', authenticate, getMe);

export default router;
