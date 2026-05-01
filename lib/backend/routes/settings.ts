import { Router } from 'express';
import { Role } from '@prisma/client';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/', getSettings);
router.patch('/', requireRole(Role.ADMIN), updateSettings);

export default router;
