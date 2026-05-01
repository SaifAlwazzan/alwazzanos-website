import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  listOffers,
  getOffer,
  createOffer,
  updateOffer,
  deleteOffer,
  updateOfferStatus,
} from '../controllers/offerController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/', listOffers);
router.get('/:id', getOffer);
router.post('/', requireRole(Role.ADMIN, Role.SALES), createOffer);
router.patch('/:id', requireRole(Role.ADMIN, Role.SALES), updateOffer);
router.patch('/:id/status', requireRole(Role.ADMIN, Role.SALES), updateOfferStatus);
router.delete('/:id', requireRole(Role.ADMIN), deleteOffer);

export default router;
