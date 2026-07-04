import { Router } from 'express';
import * as bankController from '../controllers/bankController';
import * as bankAdminController from '../controllers/bankAdminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Admin routes
router.get('/admin/transfers/pending', authenticate, requireAdmin, bankAdminController.getPendingTransfers);
router.post('/admin/transfers/:id/approve', authenticate, requireAdmin, bankAdminController.approveTransfer);
router.post('/admin/transfers/:id/reject', authenticate, requireAdmin, bankAdminController.rejectTransfer);
router.post('/admin/accounts/:id/freeze', authenticate, requireAdmin, bankAdminController.freezeAccount);
router.post('/admin/accounts/:id/unfreeze', authenticate, requireAdmin, bankAdminController.unfreezeAccount);
router.post('/admin/cards/:id/freeze', authenticate, requireAdmin, bankAdminController.freezeCardAdmin);
router.post('/admin/deposit', authenticate, requireAdmin, bankAdminController.adminDeposit);
router.get('/admin/stats', authenticate, requireAdmin, bankAdminController.adminStats);
router.get('/admin/accounts/search', authenticate, requireAdmin, bankAdminController.adminSearchAccounts);
router.get('/admin/audit', authenticate, requireAdmin, bankAdminController.adminAuditLogs);
router.patch('/admin/accounts/:id/limits', authenticate, requireAdmin, bankAdminController.updateAccountLimits);

// Provisioning & dashboard
router.post('/provision', authenticate, bankController.provision);
router.get('/dashboard', authenticate, bankController.getDashboardData);
router.get('/balance', authenticate, bankController.getBalance);

// Accounts
router.get('/accounts', authenticate, bankController.getAccounts);
router.get('/accounts/:id', authenticate, bankController.getAccount);
router.patch('/accounts/:id', authenticate, bankController.updateAccount);

// Cards
router.get('/cards', authenticate, bankController.getCards);
router.post('/cards/:id/freeze', authenticate, bankController.freezeCard);
router.post('/cards/:id/unfreeze', authenticate, bankController.unfreezeCard);
router.patch('/cards/:id/limits', authenticate, bankController.updateCardLimits);
router.post('/cards/:id/pin', authenticate, bankController.setCardPin);

// Transfers & payments
router.post('/transfer', authenticate, bankController.transfer);
router.get('/transfers', authenticate, bankController.getTransfers);
router.post('/deposit', authenticate, bankController.deposit);
router.get('/deposits', authenticate, bankController.getDeposits);
router.post('/withdraw', authenticate, bankController.withdraw);
router.get('/withdrawals', authenticate, bankController.getWithdrawals);
router.post('/payments', authenticate, bankController.makePayment);
router.get('/payments', authenticate, bankController.getPayments);
router.post('/request-money', authenticate, bankController.requestMoney);
router.post('/scheduled-transfers', authenticate, bankController.createScheduledTransfer);
router.get('/scheduled-transfers', authenticate, bankController.getScheduledTransfers);

// QR
router.post('/qr/generate', authenticate, bankController.generateQr);
router.post('/qr/scan', authenticate, bankController.scanQr);

// Transactions
router.get('/transactions', authenticate, bankController.getTransactions);
router.get('/transactions/:id', authenticate, bankController.getTransaction);
router.get('/export/csv', authenticate, bankController.exportCsv);
router.get('/export/statement', authenticate, bankController.exportStatementPdf);

// Analytics & budgets
router.get('/analytics', authenticate, bankController.getAnalyticsData);
router.get('/budgets', authenticate, bankController.getBudgets);
router.patch('/budgets/:id', authenticate, bankController.updateBudget);

// Security & notifications
router.get('/security', authenticate, bankController.getSecurity);
router.patch('/security', authenticate, bankController.updateSecurity);
router.post('/security/pin', authenticate, bankController.setBankPin);
router.get('/notifications', authenticate, bankController.getNotifications);

export default router;
