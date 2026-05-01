import { Router } from 'express';
import { Role } from '@prisma/client';
import { listUsers, createUser, updateUser, deleteUser } from '../controllers/userController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/', listUsers);
router.post('/', requireRole(Role.ADMIN), createUser);
router.patch('/:id', requireRole(Role.ADMIN), updateUser);
router.delete('/:id', requireRole(Role.ADMIN), deleteUser);

export default router;
