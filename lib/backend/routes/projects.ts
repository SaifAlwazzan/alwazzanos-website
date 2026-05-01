import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/', listProjects);
router.get('/:id', getProject);
router.post('/', requireRole(Role.ADMIN, Role.SALES), createProject);
router.patch('/:id', requireRole(Role.ADMIN, Role.SALES), updateProject);
router.delete('/:id', requireRole(Role.ADMIN), deleteProject);

export default router;
