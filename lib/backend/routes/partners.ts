import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  listPartners,
  createPartner,
  updatePartner,
  deletePartner,
  getLedger,
  listWithdrawals,
  createWithdrawal,
  deleteWithdrawal,
} from '../controllers/partnerController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/', listPartners);
router.get('/ledger', getLedger);
router.post('/', requireRole(Role.ADMIN), createPartner);
router.patch('/:id', requireRole(Role.ADMIN), updatePartner);
router.delete('/:id', requireRole(Role.ADMIN), deletePartner);

router.get('/withdrawals/all', listWithdrawals);
router.post('/withdrawals', requireRole(Role.ADMIN, Role.ACCOUNTANT), createWithdrawal);
router.delete('/withdrawals/:id', requireRole(Role.ADMIN, Role.ACCOUNTANT), deleteWithdrawal);

export default router;
