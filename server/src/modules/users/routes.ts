import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema } from './schema.js';

const router = Router();

// Staff management is accessible to ADMIN
router.use(authenticate, requireRole(['ADMIN']));

router.get('/', getUsers);
router.post('/', validate({ body: createUserSchema }), createUser);
router.put('/:id', validate({ body: updateUserSchema }), updateUser);
router.delete('/:id', deleteUser);

export default router;
