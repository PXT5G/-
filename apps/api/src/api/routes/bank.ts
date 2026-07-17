import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as bankController from '../controllers/bankController';

const router = Router();

router.post('/initialize', authenticate, bankController.initialize);
router.get('/dashboard', authenticate, bankController.dashboard);
router.get('/accounts', authenticate, bankController.accounts);
router.get('/accounts/:id', authenticate, bankController.getAccount);
router.get('/cards', authenticate, bankController.cards);
router.post('/cards/:id/freeze', authenticate, bankController.freezeCard);
router.post('/cards/:id/unfreeze', authenticate, bankController.unfreezeCard);
router.get('/transactions', authenticate, bankController.transactions);
router.get('/transfers', authenticate, bankController.transfers);
router.post('/transfers/internal', authenticate, bankController.internalTransfer);
router.post('/transfers/external', authenticate, bankController.externalTransfer);
router.post('/payments/qr', authenticate, bankController.qrPayment);
router.get('/budget', authenticate, bankController.budget);
router.get('/analytics', authenticate, bankController.analytics);

export default router;
