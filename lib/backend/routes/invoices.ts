import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  addPayment,
  deletePayment,
  generateFromOffer,
  setupPaymentPlan,
  deleteInstallment,
  uploadAttachment,
  deleteAttachment,
} from '../controllers/invoiceController';
import { requireAuth, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(requireAuth);
router.get('/', listInvoices);
router.get('/:id', getInvoice);
router.post('/', requireRole(Role.ADMIN, Role.ACCOUNTANT, Role.SALES), createInvoice);
router.post('/from-offer', requireRole(Role.ADMIN, Role.ACCOUNTANT, Role.SALES), generateFromOffer);
router.patch('/:id', requireRole(Role.ADMIN, Role.ACCOUNTANT), updateInvoice);
router.delete('/:id', requireRole(Role.ADMIN), deleteInvoice);
router.post('/:id/payments', requireRole(Role.ADMIN, Role.ACCOUNTANT), addPayment);
router.delete('/:id/payments/:paymentId', requireRole(Role.ADMIN, Role.ACCOUNTANT), deletePayment);
router.post('/:id/payment-plan', requireRole(Role.ADMIN, Role.ACCOUNTANT, Role.SALES), setupPaymentPlan);
router.delete('/:id/installments/:installmentId', requireRole(Role.ADMIN, Role.ACCOUNTANT), deleteInstallment);
router.post('/:id/attachments', requireRole(Role.ADMIN, Role.ACCOUNTANT, Role.SALES), upload.single('file'), uploadAttachment);
router.delete('/:id/attachments/:attachmentId', requireRole(Role.ADMIN, Role.ACCOUNTANT), deleteAttachment);

export default router;
