import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as businessController from '../controllers/businessController';

const router = Router();

router.post('/initialize', authenticate, businessController.initialize);
router.get('/categories', authenticate, businessController.categories);

router.get('/companies', authenticate, businessController.companies);
router.post('/companies', authenticate, businessController.createCompany);
router.get('/companies/:id', authenticate, businessController.getCompany);
router.patch('/companies/:id', authenticate, businessController.updateCompany);

router.get('/dashboard', authenticate, businessController.dashboard);
router.get('/analytics', authenticate, businessController.analytics);
router.get('/reports', authenticate, businessController.reports);
router.get('/audit', authenticate, businessController.auditLogs);

router.get('/branches', authenticate, businessController.branches);
router.post('/branches', authenticate, businessController.createBranch);

router.get('/departments', authenticate, businessController.departments);
router.post('/departments', authenticate, businessController.createDepartment);

router.get('/employees', authenticate, businessController.employees);
router.post('/employees/hire', authenticate, businessController.hireEmployee);
router.post('/employees/:id/terminate', authenticate, businessController.terminateEmployee);
router.post('/employees/:id/promote', authenticate, businessController.promoteEmployee);
router.post('/employees/attendance', authenticate, businessController.attendance);

router.get('/revenue', authenticate, businessController.revenue);
router.post('/revenue', authenticate, businessController.createRevenue);

router.get('/expenses', authenticate, businessController.expenses);
router.post('/expenses', authenticate, businessController.createExpense);
router.post('/expenses/:id/approve', authenticate, businessController.approveExpense);

router.get('/payroll', authenticate, businessController.payroll);
router.post('/payroll/process', authenticate, businessController.processPayroll);

router.get('/inventory', authenticate, businessController.inventory);
router.post('/inventory', authenticate, businessController.createInventory);
router.post('/inventory/:id/transfer', authenticate, businessController.transferInventory);

router.get('/warehouses', authenticate, businessController.warehouses);

router.get('/customers', authenticate, businessController.customers);
router.post('/customers', authenticate, businessController.createCustomer);
router.post('/customers/:id/blacklist', authenticate, businessController.blacklistCustomer);

router.get('/suppliers', authenticate, businessController.suppliers);
router.post('/suppliers', authenticate, businessController.createSupplier);

router.get('/invoices', authenticate, businessController.invoices);
router.post('/invoices', authenticate, businessController.createInvoice);
router.post('/invoices/:id/pay', authenticate, businessController.payInvoice);

router.get('/taxes', authenticate, businessController.taxes);
router.post('/taxes/file', authenticate, businessController.fileTax);
router.post('/taxes/:id/pay', authenticate, businessController.payTax);

router.get('/loans', authenticate, businessController.loans);
router.post('/loans', authenticate, businessController.createLoan);

router.get('/contracts', authenticate, businessController.contracts);
router.post('/contracts', authenticate, businessController.createContract);

router.get('/assets', authenticate, businessController.assets);
router.post('/assets', authenticate, businessController.createAsset);

router.get('/bank', authenticate, businessController.bank);
router.post('/bank/deposit', authenticate, businessController.bankDeposit);
router.post('/bank/withdraw', authenticate, businessController.bankWithdraw);
router.post('/bank/transfer', authenticate, businessController.bankTransfer);
router.post('/bank/freeze', authenticate, businessController.bankFreeze);

router.post('/government/renew', authenticate, businessController.governmentRenew);
router.post('/government/inspect', authenticate, businessController.governmentInspect);
router.post('/government/violation', authenticate, businessController.governmentViolation);
router.post('/government/suspend', authenticate, businessController.governmentSuspend);

router.get('/settings', authenticate, businessController.settings);
router.patch('/settings', authenticate, businessController.updateSettings);

router.get('/rbac', authenticate, businessController.rbac);
router.patch('/rbac', authenticate, businessController.updateRbac);

router.post('/search', authenticate, businessController.search);

export default router;
