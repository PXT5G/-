import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getActorId } from '../../services/rbacService';
import {
  BUSINESS_ROLES,
  DEFAULT_BUSINESS_CATEGORIES,
} from '../../constants/business';
import * as businessService from '../../services/businessService';

function mapError(err: unknown): never {
  if (!(err instanceof Error)) throw err;
  const map: Record<string, [number, string]> = {
    PERMISSION_DENIED: [403, 'Permission denied'],
    NOT_BUSINESS_EMPLOYEE: [403, 'Not registered as business employee'],
    APP_NOT_INSTALLED: [403, 'Business app not installed'],
    COMPANY_NOT_FOUND: [404, 'Company not found'],
    EMPLOYEE_NOT_FOUND: [404, 'Employee not found'],
    EXPENSE_NOT_FOUND: [404, 'Expense not found'],
    INVOICE_NOT_FOUND: [404, 'Invoice not found'],
    INVENTORY_NOT_FOUND: [404, 'Inventory item not found'],
    CUSTOMER_NOT_FOUND: [404, 'Customer not found'],
    TAX_NOT_FOUND: [404, 'Tax record not found'],
    INVALID_AMOUNT: [400, 'Invalid amount'],
    INSUFFICIENT_FUNDS: [400, 'Insufficient funds'],
    INSUFFICIENT_STOCK: [400, 'Insufficient stock'],
    ALREADY_EMPLOYED: [409, 'User already employed'],
    PAYROLL_ALREADY_PAID: [409, 'Payroll already paid for this period'],
    INVALID_ROLE: [400, 'Invalid role'],
    INVALID_SEARCH_TYPE: [400, 'Invalid search type'],
    USER_NOT_FOUND: [404, 'User not found'],
  };
  const entry = map[err.message];
  if (entry) throw new AppError(entry[0], entry[1]);
  throw err;
}

function clientMeta(req: AuthRequest) {
  return {
    ipAddress: req.ip,
    deviceUuid: req.headers['x-device-uuid'] as string | undefined,
  };
}

function companyId(req: AuthRequest) {
  return String(req.params.companyId ?? req.query.companyId ?? req.body?.companyId);
}

export const initialize = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.initializeBusiness(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.getDashboard(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const companies = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listCompanies(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createCompany = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    name: z.string().min(1),
    tradeName: z.string().min(1),
    licenseNumber: z.string().min(1),
    commercialRegistration: z.string().min(1),
    taxNumber: z.string().min(1),
    category: z.string().min(1),
    headquarters: z.object({
      address: z.string(), city: z.string(), district: z.string(),
      country: z.string().optional(), latitude: z.number().optional(), longitude: z.number().optional(),
    }),
    email: z.string().email(),
    phone: z.string().min(1),
    description: z.string().optional(),
    website: z.string().optional(),
    logo: z.string().optional(),
    banner: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await businessService.createCompany(getActorId(req), body, req.user!.role, clientMeta(req));
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const getCompany = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.getCompany(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateCompany = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.updateCompany(
      getActorId(req), String(req.params.id), req.body ?? {}, req.user!.role, clientMeta(req)
    );
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const branches = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listBranches(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createBranch = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.createBranch(getActorId(req), companyId(req), req.body ?? {}, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const departments = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listDepartments(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createDepartment = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.createDepartment(getActorId(req), companyId(req), req.body ?? {}, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const employees = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listEmployees(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const hireEmployee = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(),
    targetUserId: z.string(),
    role: z.enum(BUSINESS_ROLES as unknown as [string, ...string[]]),
    jobTitle: z.string(),
    departmentId: z.string().optional(),
    branchId: z.string().optional(),
    salary: z.number().min(0),
  }).parse(req.body ?? {});
  try {
    const data = await businessService.hireEmployee(
      getActorId(req), body.companyId,
      { targetUserId: body.targetUserId, role: body.role as never, jobTitle: body.jobTitle, departmentId: body.departmentId, branchId: body.branchId, salary: body.salary },
      req.user!.role, clientMeta(req)
    );
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const terminateEmployee = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string(), reason: z.string() }).parse(req.body ?? {});
  try {
    const data = await businessService.terminateEmployee(getActorId(req), body.companyId, String(req.params.id), body.reason, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const promoteEmployee = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(),
    role: z.enum(BUSINESS_ROLES as unknown as [string, ...string[]]),
    jobTitle: z.string(),
  }).parse(req.body ?? {});
  try {
    const data = await businessService.promoteEmployee(getActorId(req), body.companyId, String(req.params.id), body.role as never, body.jobTitle, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const attendance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string(), type: z.enum(['check_in', 'check_out']) }).parse(req.body ?? {});
  try {
    const data = await businessService.recordAttendance(req.user!.userId, body.companyId, body.type, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const revenue = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listRevenue(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createRevenue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(),
    source: z.string(),
    category: z.string(),
    amount: z.number().positive(),
    description: z.string().optional(),
    customerId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await businessService.createRevenue(getActorId(req), body.companyId, body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const expenses = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listExpenses(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(),
    category: z.string(),
    amount: z.number().positive(),
    description: z.string().optional(),
    vendor: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await businessService.createExpense(getActorId(req), body.companyId, body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const approveExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string() }).parse(req.body ?? {});
  try {
    const data = await businessService.approveExpense(getActorId(req), body.companyId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const payroll = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listPayroll(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const processPayroll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string(), employeeId: z.string() }).parse(req.body ?? {});
  try {
    const data = await businessService.processPayroll(getActorId(req), body.companyId, body.employeeId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const inventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listInventory(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(),
    warehouseId: z.string(),
    sku: z.string(),
    name: z.string(),
    category: z.string(),
    purchaseCost: z.number().min(0),
    sellingPrice: z.number().min(0),
    stockQuantity: z.number().min(0),
    description: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await businessService.createInventoryItem(getActorId(req), body.companyId, body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const transferInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string(), toWarehouseId: z.string(), quantity: z.number().positive() }).parse(req.body ?? {});
  try {
    const data = await businessService.transferInventory(getActorId(req), body.companyId, String(req.params.id), body.toWarehouseId, body.quantity, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const warehouses = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listWarehouses(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const customers = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listCustomers(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(),
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    userId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await businessService.createCustomer(getActorId(req), body.companyId, body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const blacklistCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string(), reason: z.string() }).parse(req.body ?? {});
  try {
    const data = await businessService.blacklistCustomer(getActorId(req), body.companyId, String(req.params.id), body.reason, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const suppliers = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listSuppliers(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(),
    name: z.string(),
    contactName: z.string(),
    email: z.string(),
    phone: z.string(),
    category: z.string(),
    address: z.string().optional(),
    taxNumber: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await businessService.createSupplier(getActorId(req), body.companyId, body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const invoices = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listInvoices(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(),
    type: z.enum(['sale', 'purchase', 'service']),
    customerId: z.string().optional(),
    supplierId: z.string().optional(),
    lineItems: z.array(z.object({ description: z.string(), quantity: z.number(), unitPrice: z.number() })),
    taxRate: z.number().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await businessService.createInvoice(getActorId(req), body.companyId, body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const payInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string() }).parse(req.body ?? {});
  try {
    const data = await businessService.payInvoice(getActorId(req), body.companyId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const taxes = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listTaxes(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const fileTax = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string(), taxType: z.string() }).parse(req.body ?? {});
  try {
    const data = await businessService.fileTax(getActorId(req), body.companyId, body.taxType, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const payTax = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string() }).parse(req.body ?? {});
  try {
    const data = await businessService.payTax(getActorId(req), body.companyId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const loans = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listLoans(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createLoan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(),
    lender: z.string(),
    principal: z.number().positive(),
    interestRate: z.number().min(0),
    termMonths: z.number().int().positive(),
  }).parse(req.body ?? {});
  try {
    const data = await businessService.createLoan(getActorId(req), body.companyId, body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const contracts = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listContracts(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createContract = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(),
    title: z.string(),
    type: z.enum(['supplier', 'customer', 'government', 'employment', 'service', 'lease']),
    partyName: z.string(),
    partyId: z.string().optional(),
    value: z.number().min(0),
    startDate: z.string(),
    endDate: z.string(),
    terms: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await businessService.createContract(getActorId(req), body.companyId, {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    }, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const bank = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.getBank(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const bankDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string(), amount: z.number().positive(), description: z.string() }).parse(req.body ?? {});
  try {
    const data = await businessService.bankDeposit(getActorId(req), body.companyId, body.amount, body.description, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const bankWithdraw = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string(), amount: z.number().positive(), description: z.string() }).parse(req.body ?? {});
  try {
    const data = await businessService.bankWithdraw(getActorId(req), body.companyId, body.amount, body.description, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const bankTransfer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(),
    from: z.enum(['main', 'payroll', 'tax', 'loan']),
    to: z.enum(['main', 'payroll', 'tax', 'loan']),
    amount: z.number().positive(),
    description: z.string(),
  }).parse(req.body ?? {});
  try {
    const data = await businessService.bankTransfer(getActorId(req), body.companyId, body.from, body.to, body.amount, body.description, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const bankFreeze = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string(), amount: z.number().positive(), reason: z.string() }).parse(req.body ?? {});
  try {
    const data = await businessService.bankFreeze(getActorId(req), body.companyId, body.amount, body.reason, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const analytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.getAnalytics(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const reports = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.getFinancialReport(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const auditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.getAuditLogs(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const governmentRenew = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string() }).parse(req.body ?? {});
  try {
    const data = await businessService.renewLicense(getActorId(req), body.companyId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const governmentInspect = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string(), action: z.enum(['schedule', 'complete']), passed: z.boolean().optional() }).parse(req.body ?? {});
  try {
    const data = body.action === 'schedule'
      ? await businessService.scheduleInspection(getActorId(req), body.companyId, req.user!.role)
      : await businessService.completeInspection(getActorId(req), body.companyId, body.passed ?? true, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const governmentViolation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string(), fine: z.number().min(0), reason: z.string() }).parse(req.body ?? {});
  try {
    const data = await businessService.recordViolation(getActorId(req), body.companyId, body.fine, body.reason, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const governmentSuspend = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string(), reason: z.string() }).parse(req.body ?? {});
  try {
    const data = await businessService.suspendBusiness(getActorId(req), body.companyId, body.reason, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ companyId: z.string(), query: z.string(), type: z.string() }).parse(req.body ?? {});
  try {
    const data = await businessService.search(req.user!.userId, body.companyId, body.query, body.type, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const settings = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.getSettings(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(),
    settings: z.record(z.unknown()).optional(),
    categories: z.array(z.string()).optional(),
  }).parse(req.body ?? {});
  try {
    const data = await businessService.updateSettings(getActorId(req), body.companyId, body.settings ?? {}, body.categories, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const assets = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.listAssets(req.user!.userId, companyId(req), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createAsset = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(),
    name: z.string(),
    category: z.string(),
    purchaseCost: z.number().min(0),
    serialNumber: z.string().optional(),
    branchId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await businessService.createAsset(getActorId(req), body.companyId, body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const rbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await businessService.getRbac(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateRbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    role: z.enum(BUSINESS_ROLES as unknown as [string, ...string[]]),
    permissions: z.array(z.string()),
  }).parse(req.body ?? {});
  try {
    const data = await businessService.updateRbac(getActorId(req), body.role as never, body.permissions, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const categories = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: DEFAULT_BUSINESS_CATEGORIES });
});
