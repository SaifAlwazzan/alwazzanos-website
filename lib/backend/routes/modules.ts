import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  listModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
  listCategories,
} from '../controllers/moduleController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/categories/all', listCategories);
router.get('/', listModules);
router.get('/:id', getModule);
router.post('/', requireRole(Role.ADMIN, Role.SALES), createModule);
router.patch('/:id', requireRole(Role.ADMIN, Role.SALES), updateModule);
router.delete('/:id', requireRole(Role.ADMIN), deleteModule);

export default router;
