import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/clientController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/', listClients);
router.get('/:id', getClient);
router.post('/', requireRole(Role.ADMIN, Role.SALES), createClient);
router.patch('/:id', requireRole(Role.ADMIN, Role.SALES), updateClient);
router.delete('/:id', requireRole(Role.ADMIN), deleteClient);

export default router;
