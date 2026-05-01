import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  pushToInvoice,
  reimburse,
} from '../controllers/expenseController';
import { requireAuth, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(requireAuth);
router.get('/', listExpenses);
router.get('/:id', getExpense);
router.post('/', requireRole(Role.ADMIN, Role.ACCOUNTANT, Role.SALES), upload.single('receipt'), createExpense);
router.patch('/:id', requireRole(Role.ADMIN, Role.ACCOUNTANT, Role.SALES), upload.single('receipt'), updateExpense);
router.delete('/:id', requireRole(Role.ADMIN, Role.ACCOUNTANT), deleteExpense);
router.post('/push-to-invoice', requireRole(Role.ADMIN, Role.ACCOUNTANT, Role.SALES), pushToInvoice);
router.post('/:id/reimburse', requireRole(Role.ADMIN, Role.ACCOUNTANT), reimburse);

export default router;
