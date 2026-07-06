import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { User } from '../database/models/User';
import { Company } from '../database/models/Company';
import { CompanyBranch } from '../database/models/CompanyBranch';
import { CompanyDepartment } from '../database/models/CompanyDepartment';
import { CompanyEmployee } from '../database/models/CompanyEmployee';
import { CompanyRevenue } from '../database/models/CompanyRevenue';
import { CompanyExpense } from '../database/models/CompanyExpense';
import { CompanyPayroll } from '../database/models/CompanyPayroll';
import { CompanyAsset } from '../database/models/CompanyAsset';
import { CompanyInventory } from '../database/models/CompanyInventory';
import { CompanyWarehouse } from '../database/models/CompanyWarehouse';
import { CompanySupplier } from '../database/models/CompanySupplier';
import { CompanyCustomer } from '../database/models/CompanyCustomer';
import { CompanyInvoice } from '../database/models/CompanyInvoice';
import { CompanyLoan } from '../database/models/CompanyLoan';
import { CompanyTax } from '../database/models/CompanyTax';
import { CompanyContract } from '../database/models/CompanyContract';
import { CompanyAnalytics } from '../database/models/CompanyAnalytics';
import { CompanyAuditLog } from '../database/models/CompanyAuditLog';
import {
  BUSINESS_APP_BUNDLE,
  BUSINESS_ROLES,
  DEFAULT_BUSINESS_CATEGORIES,
  type BusinessRole,
} from '../constants/business';
import {
  seedBusinessRoleConfigs,
  assertBusinessPermission,
  checkBusinessPermission,
  formatEmployee,
  getRolePermissions,
  updateRolePermissions,
  createDigitalSignature,
  getEmployeeProfile,
} from './businessRBACService';
import {
  provisionCompanyBanking,
  deposit,
  withdraw,
  transferBetweenAccounts,
  freezeFunds,
  unfreezeFunds,
  getBankSummary,
} from './businessBankService';
import {
  logBusinessAction,
  notifyBusinessUser,
  currentPeriod,
  formatCompany,
  searchIdentity,
  getWorldLocation,
} from './businessIntegrationService';
import { emitToUser } from './socketService';
import { checkPermission } from './permissionBrokerService';

function id(prefix: string) {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

async function broadcastCompany(companyId: string, event: string, data: unknown) {
  const employees = await CompanyEmployee.find({ companyId, deletedAt: null, status: { $ne: 'terminated' } });
  const company = await Company.findOne({ companyId, deletedAt: null });
  const targets = new Set(employees.map((e) => e.userId.toString()));
  if (company) targets.add(company.ownerUserId.toString());
  for (const uid of targets) {
    emitToUser(uid, event as never, data);
  }
}

async function recalculateFinancials(companyId: string) {
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) return;

  const [revenueAgg, expenseAgg, payrollAgg, assetAgg, inventoryAgg, loanAgg, customerCount, employeeCount] =
    await Promise.all([
      CompanyRevenue.aggregate([
        { $match: { companyId, deletedAt: null } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      CompanyExpense.aggregate([
        { $match: { companyId, deletedAt: null, status: { $in: ['approved', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      CompanyPayroll.aggregate([
        { $match: { companyId, deletedAt: null, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$netPay' } } },
      ]),
      CompanyAsset.aggregate([
        { $match: { companyId, deletedAt: null, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$currentValue' } } },
      ]),
      CompanyInventory.aggregate([
        { $match: { companyId, deletedAt: null } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$stockQuantity', '$purchaseCost'] } } } },
      ]),
      CompanyLoan.aggregate([
        { $match: { companyId, deletedAt: null, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$remainingBalance' } } },
      ]),
      CompanyCustomer.countDocuments({ companyId, deletedAt: null }),
      CompanyEmployee.countDocuments({ companyId, deletedAt: null, status: { $ne: 'terminated' } }),
    ]);

  const totalRevenue = revenueAgg[0]?.total ?? 0;
  const totalExpenses = expenseAgg[0]?.total ?? 0;
  const payrollTotal = payrollAgg[0]?.total ?? 0;
  const totalAssets = assetAgg[0]?.total ?? 0;
  const inventoryValue = inventoryAgg[0]?.total ?? 0;
  const totalLoans = loanAgg[0]?.total ?? 0;

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const yearStart = `${now.getFullYear()}`;

  const [monthlyRev, yearlyRev] = await Promise.all([
    CompanyRevenue.aggregate([
      { $match: { companyId, deletedAt: null, period: monthStart } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    CompanyRevenue.aggregate([
      { $match: { companyId, deletedAt: null, period: { $regex: `^${yearStart}` } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  company.totalRevenue = totalRevenue;
  company.totalExpenses = totalExpenses;
  company.netProfit = totalRevenue - totalExpenses - payrollTotal;
  company.operatingCost = totalExpenses;
  company.payrollTotal = payrollTotal;
  company.totalAssets = totalAssets + inventoryValue;
  company.inventoryValue = inventoryValue;
  company.totalLoans = totalLoans;
  company.totalDebt = totalLoans;
  company.monthlyIncome = monthlyRev[0]?.total ?? 0;
  company.yearlyIncome = yearlyRev[0]?.total ?? 0;
  company.customerCount = customerCount;
  company.employeeCount = employeeCount;
  await company.save();

  await updateAnalytics(companyId);
  await broadcastCompany(companyId, 'business:analytics:update', { companyId });
}

async function updateAnalytics(companyId: string) {
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) return;

  const period = currentPeriod();
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const [dailyRev, weeklyRev, topProducts, topEmployees] = await Promise.all([
    CompanyRevenue.aggregate([
      { $match: { companyId, deletedAt: null, createdAt: { $gte: dayStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    CompanyRevenue.aggregate([
      { $match: { companyId, deletedAt: null, createdAt: { $gte: weekStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    CompanyInventory.find({ companyId, deletedAt: null }).sort({ sellingPrice: -1 }).limit(5),
    CompanyEmployee.find({ companyId, deletedAt: null, status: 'active' }).sort({ performanceScore: -1 }).limit(5),
  ]);

  const salesChart = await CompanyRevenue.aggregate([
    { $match: { companyId, deletedAt: null, createdAt: { $gte: weekStart } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$amount' } } },
    { $sort: { _id: 1 } },
  ]);

  const prevMonth = company.monthlyIncome > 0 ? company.monthlyIncome : 1;
  const growth = ((company.monthlyIncome - prevMonth) / prevMonth) * 100;

  await CompanyAnalytics.findOneAndUpdate(
    { companyId, period },
    {
      analyticsId: id('AN'),
      companyId,
      period,
      dailyRevenue: dailyRev[0]?.total ?? 0,
      weeklyRevenue: weeklyRev[0]?.total ?? 0,
      monthlyRevenue: company.monthlyIncome,
      yearlyRevenue: company.yearlyIncome,
      profit: company.netProfit > 0 ? company.netProfit : 0,
      loss: company.netProfit < 0 ? Math.abs(company.netProfit) : 0,
      growth,
      expenses: company.totalExpenses,
      payroll: company.payrollTotal,
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        name: p.name,
        revenue: p.sellingPrice * p.stockQuantity,
        units: p.stockQuantity,
      })),
      topEmployees: await Promise.all(topEmployees.map(async (e) => {
        const user = await User.findById(e.userId);
        return { employeeId: e.employeeId, name: user?.displayName ?? 'Employee', revenue: e.performanceScore };
      })),
      customerCount: company.customerCount,
      salesChart: salesChart.map((s) => ({ date: s._id, revenue: s.revenue, expenses: 0 })),
      financialChart: [{ month: period, income: company.monthlyIncome, expenses: company.totalExpenses, profit: company.netProfit }],
      performanceReport: {
        employeeCount: company.employeeCount,
        inventoryValue: company.inventoryValue,
        totalAssets: company.totalAssets,
      },
      computedAt: new Date(),
    },
    { upsert: true }
  );
}

export async function initializeBusiness(userId: string, userRole?: string) {
  await seedBusinessRoleConfigs();

  const hasApp = await checkPermission(userId, BUSINESS_APP_BUNDLE, 'location');
  if (!hasApp && userRole !== 'admin') throw new Error('APP_NOT_INSTALLED');

  const owned = await Company.find({ ownerUserId: userId, deletedAt: null });
  const employment = await CompanyEmployee.find({ userId, deletedAt: null, status: { $ne: 'terminated' } });
  const permissions = userRole === 'admin'
    ? ['platform.access', 'company.create', 'dashboard.view']
    : await (async () => {
        const emp = employment[0];
        if (emp) return getRolePermissions(emp.role);
        return ['platform.access', 'dashboard.view', 'company.create', 'company.view'];
      })();

  emitToUser(userId, 'business:initialized', {
    companies: owned.map(formatCompany),
    employmentCount: employment.length,
    categories: DEFAULT_BUSINESS_CATEGORIES,
  });

  return {
    initialized: true,
    companies: owned.map(formatCompany),
    employment: employment.map((e) => ({ employeeId: e.employeeId, companyId: e.companyId, role: e.role })),
    permissions,
    categories: DEFAULT_BUSINESS_CATEGORIES,
  };
}

export async function getDashboard(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'dashboard.view', companyId, userRole);
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');

  const employee = await getEmployeeProfile(userId, companyId);
  const analytics = await CompanyAnalytics.findOne({ companyId, period: currentPeriod() });
  const permissions = await (async () => {
    if (company.ownerUserId.toString() === userId) return ['owner'];
    if (employee) return getRolePermissions(employee.role);
    return [];
  })();

  const location = await getWorldLocation(userId).catch(() => null);

  return {
    company: formatCompany(company),
    employee: employee ? formatEmployee(employee) : null,
    stats: {
      dailyRevenue: analytics?.dailyRevenue ?? 0,
      weeklyRevenue: analytics?.weeklyRevenue ?? 0,
      monthlyRevenue: analytics?.monthlyRevenue ?? company.monthlyIncome,
      yearlyRevenue: analytics?.yearlyRevenue ?? company.yearlyIncome,
      profit: company.netProfit,
      expenses: company.totalExpenses,
      payroll: company.payrollTotal,
      employees: company.employeeCount,
      customers: company.customerCount,
      inventoryValue: company.inventoryValue,
    },
    bank: {
      availableBalance: company.availableBalance,
      frozenBalance: company.frozenBalance,
      iban: company.iban,
    },
    analytics: analytics ?? null,
    location,
    permissions,
  };
}

export async function createCompany(
  userId: string,
  data: {
    name: string;
    tradeName: string;
    licenseNumber: string;
    commercialRegistration: string;
    taxNumber: string;
    category: string;
    headquarters: { address: string; city: string; district: string; country?: string; latitude?: number; longitude?: number };
    email: string;
    phone: string;
    description?: string;
    website?: string;
    logo?: string;
    banner?: string;
    partners?: { name: string; sharePercent?: number }[];
    shareholders?: { name: string; shares: number; sharePercent: number }[];
  },
  userRole?: string,
  meta?: { ipAddress?: string; deviceUuid?: string }
) {
  await assertBusinessPermission(userId, 'company.create', undefined, userRole);

  const companyId = id('CO');
  const banking = provisionCompanyBanking(companyId);

  const company = await Company.create({
    companyId,
    ...data,
    headquarters: { ...data.headquarters, country: data.headquarters.country ?? 'GULF' },
    ownerUserId: new Types.ObjectId(userId),
    partners: data.partners ?? [],
    shareholders: data.shareholders ?? [],
    status: 'pending',
    categories: [data.category],
    ...banking,
    createdBy: new Types.ObjectId(userId),
  });

  const branchId = id('BR');
  await CompanyBranch.create({
    branchId,
    companyId,
    name: `${data.name} HQ`,
    code: 'HQ',
    address: data.headquarters.address,
    city: data.headquarters.city,
    district: data.headquarters.district,
    latitude: data.headquarters.latitude,
    longitude: data.headquarters.longitude,
    phone: data.phone,
    email: data.email,
    isHeadquarters: true,
    status: 'active',
    createdBy: new Types.ObjectId(userId),
  });

  const warehouseId = id('WH');
  await CompanyWarehouse.create({
    warehouseId,
    companyId,
    branchId,
    name: 'Main Warehouse',
    code: 'WH-MAIN',
    address: data.headquarters.address,
    city: data.headquarters.city,
    status: 'active',
    createdBy: new Types.ObjectId(userId),
  });

  const employeeId = id('EMP');
  await CompanyEmployee.create({
    employeeId,
    companyId,
    userId: new Types.ObjectId(userId),
    branchId,
    role: 'owner',
    jobTitle: 'Owner',
    rank: 'Executive',
    status: 'active',
    salary: 0,
    signatureHash: crypto.createHash('sha256').update(`${employeeId}:${userId}`).digest('hex'),
    createdBy: new Types.ObjectId(userId),
  });

  company.status = 'active';
  company.employeeCount = 1;
  company.licenseExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await company.save();

  await logBusinessAction({
    companyId,
    userId,
    actorId: userId,
    action: 'company_created',
    resource: 'company',
    resourceId: companyId,
    metadata: { name: data.name },
    ipAddress: meta?.ipAddress,
    deviceUuid: meta?.deviceUuid,
  });

  await notifyBusinessUser(userId, 'Company Registered', `${data.name} has been registered successfully.`, `/business/${companyId}`);
  await broadcastCompany(companyId, 'business:company:update', { company: formatCompany(company) });

  return formatCompany(company);
}

export async function listCompanies(userId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'company.view', undefined, userRole);
  const owned = await Company.find({ ownerUserId: userId, deletedAt: null }).sort({ createdAt: -1 });
  const employed = await CompanyEmployee.find({ userId, deletedAt: null, status: { $ne: 'terminated' } });
  const employedIds = employed.map((e) => e.companyId);
  const memberOf = employedIds.length
    ? await Company.find({ companyId: { $in: employedIds }, deletedAt: null })
    : [];
  const all = [...owned, ...memberOf.filter((c) => !owned.find((o) => o.companyId === c.companyId))];
  return all.map(formatCompany);
}

export async function getCompany(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'company.view', companyId, userRole);
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  return formatCompany(company);
}

export async function updateCompany(
  userId: string,
  companyId: string,
  updates: Record<string, unknown>,
  userRole?: string,
  meta?: { ipAddress?: string; deviceUuid?: string }
) {
  await assertBusinessPermission(userId, 'company.manage', companyId, userRole);
  const company = await Company.findOneAndUpdate(
    { companyId, deletedAt: null },
    { ...updates, updatedBy: new Types.ObjectId(userId) },
    { new: true }
  );
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  await logBusinessAction({
    companyId, userId, actorId: userId, action: 'company_updated', resource: 'company', resourceId: companyId,
    metadata: updates, ipAddress: meta?.ipAddress, deviceUuid: meta?.deviceUuid,
  });
  await broadcastCompany(companyId, 'business:company:update', { company: formatCompany(company) });
  return formatCompany(company);
}

// Branches
export async function listBranches(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'branches.view', companyId, userRole);
  return CompanyBranch.find({ companyId, deletedAt: null }).sort({ isHeadquarters: -1, name: 1 });
}

export async function createBranch(userId: string, companyId: string, data: Record<string, unknown>, userRole?: string) {
  await assertBusinessPermission(userId, 'branches.manage', companyId, userRole);
  const branch = await CompanyBranch.create({
    branchId: id('BR'),
    companyId,
    ...data,
    createdBy: new Types.ObjectId(userId),
  });
  return branch;
}

// Departments
export async function listDepartments(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'departments.view', companyId, userRole);
  return CompanyDepartment.find({ companyId, deletedAt: null });
}

export async function createDepartment(userId: string, companyId: string, data: Record<string, unknown>, userRole?: string) {
  await assertBusinessPermission(userId, 'departments.manage', companyId, userRole);
  return CompanyDepartment.create({
    departmentId: id('DEPT'),
    companyId,
    ...data,
    createdBy: new Types.ObjectId(userId),
  });
}

// Employees
export async function listEmployees(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'employees.view', companyId, userRole);
  const employees = await CompanyEmployee.find({ companyId, deletedAt: null });
  return Promise.all(employees.map(async (e) => {
    const user = await User.findById(e.userId);
    return formatEmployee(e, user ?? undefined);
  }));
}

export async function hireEmployee(
  userId: string,
  companyId: string,
  data: { targetUserId: string; role: BusinessRole; jobTitle: string; departmentId?: string; branchId?: string; salary: number },
  userRole?: string,
  meta?: { ipAddress?: string; deviceUuid?: string }
) {
  await assertBusinessPermission(userId, 'employees.hire', companyId, userRole);
  if (!BUSINESS_ROLES.includes(data.role)) throw new Error('INVALID_ROLE');

  const existing = await CompanyEmployee.findOne({ companyId, userId: data.targetUserId, deletedAt: null });
  if (existing && existing.status !== 'terminated') throw new Error('ALREADY_EMPLOYED');

  const employeeId = id('EMP');
  const employee = await CompanyEmployee.create({
    employeeId,
    companyId,
    userId: new Types.ObjectId(data.targetUserId),
    branchId: data.branchId,
    departmentId: data.departmentId,
    role: data.role,
    jobTitle: data.jobTitle,
    salary: data.salary,
    status: 'probation',
    signatureHash: crypto.createHash('sha256').update(`${employeeId}:${data.targetUserId}`).digest('hex'),
    createdBy: new Types.ObjectId(userId),
  });

  await Company.updateOne({ companyId }, { $inc: { employeeCount: 1 } });
  await notifyBusinessUser(data.targetUserId, 'Hired', `You have been hired at company ${companyId}`, `/business/${companyId}`);
  await broadcastCompany(companyId, 'business:employee:update', { employeeId, action: 'hired' });
  await logBusinessAction({
    companyId, userId: data.targetUserId, actorId: userId, action: 'employee_hired', resource: 'employee', resourceId: employeeId,
    ipAddress: meta?.ipAddress, deviceUuid: meta?.deviceUuid,
  });
  return formatEmployee(employee);
}

export async function terminateEmployee(userId: string, companyId: string, employeeId: string, reason: string, userRole?: string) {
  await assertBusinessPermission(userId, 'employees.terminate', companyId, userRole);
  const employee = await CompanyEmployee.findOne({ employeeId, companyId, deletedAt: null });
  if (!employee) throw new Error('EMPLOYEE_NOT_FOUND');
  employee.status = 'terminated';
  employee.terminationDate = new Date();
  employee.activityLog.push({ action: 'terminated', details: reason, timestamp: new Date() });
  await employee.save();
  await Company.updateOne({ companyId }, { $inc: { employeeCount: -1 } });
  await broadcastCompany(companyId, 'business:employee:update', { employeeId, action: 'terminated' });
  return formatEmployee(employee);
}

export async function promoteEmployee(userId: string, companyId: string, employeeId: string, newRole: BusinessRole, newTitle: string, userRole?: string) {
  await assertBusinessPermission(userId, 'employees.promote', companyId, userRole);
  const employee = await CompanyEmployee.findOne({ employeeId, companyId, deletedAt: null });
  if (!employee) throw new Error('EMPLOYEE_NOT_FOUND');
  employee.role = newRole;
  employee.jobTitle = newTitle;
  employee.activityLog.push({ action: 'promoted', details: `Promoted to ${newTitle}`, timestamp: new Date() });
  await employee.save();
  await broadcastCompany(companyId, 'business:employee:update', { employeeId, action: 'promoted' });
  return formatEmployee(employee);
}

export async function recordAttendance(userId: string, companyId: string, type: 'check_in' | 'check_out', userRole?: string) {
  await assertBusinessPermission(userId, 'employees.attendance', companyId, userRole);
  const employee = await requireEmployeeRecord(userId, companyId);
  const today = new Date().toISOString().slice(0, 10);
  let record = employee.attendance.find((a) => a.date === today);
  if (!record) {
    record = { date: today, hoursWorked: 0 };
    employee.attendance.push(record);
  }
  if (type === 'check_in') record.checkIn = new Date();
  else if (type === 'check_out' && record.checkIn) {
    record.checkOut = new Date();
    record.hoursWorked = (record.checkOut.getTime() - record.checkIn.getTime()) / 3600000;
  }
  await employee.save();
  return { date: today, checkIn: record.checkIn, checkOut: record.checkOut, hoursWorked: record.hoursWorked };
}

async function requireEmployeeRecord(userId: string, companyId: string) {
  const employee = await CompanyEmployee.findOne({ userId, companyId, deletedAt: null });
  if (!employee) throw new Error('NOT_BUSINESS_EMPLOYEE');
  return employee;
}

// Revenue & Expenses
export async function createRevenue(userId: string, companyId: string, data: { source: string; category: string; amount: number; description?: string; customerId?: string }, userRole?: string) {
  await assertBusinessPermission(userId, 'revenue.create', companyId, userRole);
  const revenue = await CompanyRevenue.create({
    revenueId: id('REV'),
    companyId,
    ...data,
    recordedBy: new Types.ObjectId(userId),
    period: currentPeriod(),
    createdBy: new Types.ObjectId(userId),
  });
  await deposit(companyId, data.amount, `Revenue: ${data.source}`, 'main', revenue.revenueId);
  await recalculateFinancials(companyId);
  await broadcastCompany(companyId, 'business:revenue:update', { revenueId: revenue.revenueId, amount: data.amount });
  return revenue;
}

export async function listRevenue(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'revenue.view', companyId, userRole);
  return CompanyRevenue.find({ companyId, deletedAt: null }).sort({ createdAt: -1 }).limit(100);
}

export async function createExpense(userId: string, companyId: string, data: { category: string; amount: number; description?: string; vendor?: string }, userRole?: string) {
  await assertBusinessPermission(userId, 'expenses.create', companyId, userRole);
  const expense = await CompanyExpense.create({
    expenseId: id('EXP'),
    companyId,
    ...data,
    status: 'pending',
    period: currentPeriod(),
    createdBy: new Types.ObjectId(userId),
  });
  await broadcastCompany(companyId, 'business:expense:update', { expenseId: expense.expenseId });
  return expense;
}

export async function approveExpense(userId: string, companyId: string, expenseId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'expenses.manage', companyId, userRole);
  const expense = await CompanyExpense.findOne({ expenseId, companyId, deletedAt: null });
  if (!expense) throw new Error('EXPENSE_NOT_FOUND');
  expense.status = 'approved';
  expense.approvedBy = new Types.ObjectId(userId);
  await expense.save();
  await withdraw(companyId, expense.amount, `Expense: ${expense.category}`, 'main', expense.expenseId);
  expense.status = 'paid';
  await expense.save();
  await recalculateFinancials(companyId);
  await broadcastCompany(companyId, 'business:expense:update', { expenseId, status: 'paid' });
  return expense;
}

export async function listExpenses(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'expenses.view', companyId, userRole);
  return CompanyExpense.find({ companyId, deletedAt: null }).sort({ createdAt: -1 }).limit(100);
}

// Payroll
export async function processPayroll(userId: string, companyId: string, employeeId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'payroll.process', companyId, userRole);
  const employee = await CompanyEmployee.findOne({ employeeId, companyId, deletedAt: null, status: 'active' });
  if (!employee) throw new Error('EMPLOYEE_NOT_FOUND');

  const period = currentPeriod();
  const existing = await CompanyPayroll.findOne({ companyId, employeeId, period });
  if (existing && existing.status === 'paid') throw new Error('PAYROLL_ALREADY_PAID');

  const commission = employee.salary * (employee.commissionRate / 100);
  const netPay = employee.salary + employee.bonus + commission;

  const payroll = await CompanyPayroll.findOneAndUpdate(
    { companyId, employeeId, period },
    {
      payrollId: id('PAY'),
      companyId,
      employeeId,
      period,
      baseSalary: employee.salary,
      bonus: employee.bonus,
      commission,
      deductions: 0,
      netPay,
      status: 'processed',
      processedAt: new Date(),
      processedBy: new Types.ObjectId(userId),
    },
    { upsert: true, new: true }
  );

  await transferBetweenAccounts(companyId, 'main', 'payroll', netPay, `Payroll ${period} for ${employeeId}`);
  payroll.status = 'paid';
  payroll.paidAt = new Date();
  await payroll.save();

  await recalculateFinancials(companyId);
  await broadcastCompany(companyId, 'business:payroll:update', { payrollId: payroll.payrollId, employeeId });
  return payroll;
}

export async function listPayroll(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'payroll.view', companyId, userRole);
  return CompanyPayroll.find({ companyId, deletedAt: null }).sort({ createdAt: -1 }).limit(100);
}

// Inventory
export async function listInventory(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'inventory.view', companyId, userRole);
  return CompanyInventory.find({ companyId, deletedAt: null });
}

export async function createInventoryItem(
  userId: string,
  companyId: string,
  data: { warehouseId: string; sku: string; name: string; category: string; purchaseCost: number; sellingPrice: number; stockQuantity: number; description?: string },
  userRole?: string
) {
  await assertBusinessPermission(userId, 'inventory.manage', companyId, userRole);
  const status = data.stockQuantity <= 0 ? 'out_of_stock' : data.stockQuantity < 10 ? 'low_stock' : 'in_stock';
  const item = await CompanyInventory.create({
    inventoryId: id('INV'),
    productId: id('PRD'),
    companyId,
    ...data,
    status,
    createdBy: new Types.ObjectId(userId),
  });
  await recalculateFinancials(companyId);
  await broadcastCompany(companyId, 'business:inventory:update', { inventoryId: item.inventoryId });
  return item;
}

export async function transferInventory(
  userId: string,
  companyId: string,
  inventoryId: string,
  toWarehouseId: string,
  quantity: number,
  userRole?: string
) {
  await assertBusinessPermission(userId, 'inventory.transfer', companyId, userRole);
  const item = await CompanyInventory.findOne({ inventoryId, companyId, deletedAt: null });
  if (!item) throw new Error('INVENTORY_NOT_FOUND');
  if (item.stockQuantity < quantity) throw new Error('INSUFFICIENT_STOCK');

  item.stockQuantity -= quantity;
  item.status = item.stockQuantity <= 0 ? 'out_of_stock' : item.stockQuantity < item.minStockLevel ? 'low_stock' : 'in_stock';
  await item.save();

  const existing = await CompanyInventory.findOne({ companyId, sku: item.sku, warehouseId: toWarehouseId, deletedAt: null });
  if (existing) {
    existing.stockQuantity += quantity;
    existing.status = existing.stockQuantity < existing.minStockLevel ? 'low_stock' : 'in_stock';
    await existing.save();
  } else {
    await CompanyInventory.create({
      inventoryId: id('INV'),
      productId: item.productId,
      companyId,
      warehouseId: toWarehouseId,
      sku: item.sku,
      name: item.name,
      description: item.description,
      category: item.category,
      stockQuantity: quantity,
      purchaseCost: item.purchaseCost,
      sellingPrice: item.sellingPrice,
      status: 'in_stock',
      createdBy: new Types.ObjectId(userId),
    });
  }
  await broadcastCompany(companyId, 'business:inventory:update', { inventoryId, action: 'transfer' });
  return { transferred: quantity, toWarehouseId };
}

// Warehouses
export async function listWarehouses(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'warehouses.view', companyId, userRole);
  return CompanyWarehouse.find({ companyId, deletedAt: null });
}

// Customers
export async function listCustomers(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'customers.view', companyId, userRole);
  return CompanyCustomer.find({ companyId, deletedAt: null }).sort({ totalSpent: -1 });
}

export async function createCustomer(userId: string, companyId: string, data: { name: string; email?: string; phone?: string; userId?: string }, userRole?: string) {
  await assertBusinessPermission(userId, 'customers.manage', companyId, userRole);
  const customer = await CompanyCustomer.create({
    customerId: id('CUST'),
    companyId,
    ...data,
    userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
    createdBy: new Types.ObjectId(userId),
  });
  await Company.updateOne({ companyId }, { $inc: { customerCount: 1 } });
  return customer;
}

export async function blacklistCustomer(userId: string, companyId: string, customerId: string, reason: string, userRole?: string) {
  await assertBusinessPermission(userId, 'customers.blacklist', companyId, userRole);
  const customer = await CompanyCustomer.findOne({ customerId, companyId, deletedAt: null });
  if (!customer) throw new Error('CUSTOMER_NOT_FOUND');
  customer.isBlacklisted = true;
  customer.blacklistReason = reason;
  await customer.save();
  return customer;
}

// Suppliers
export async function listSuppliers(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'suppliers.view', companyId, userRole);
  return CompanySupplier.find({ companyId, deletedAt: null });
}

export async function createSupplier(userId: string, companyId: string, data: Record<string, unknown>, userRole?: string) {
  await assertBusinessPermission(userId, 'suppliers.manage', companyId, userRole);
  return CompanySupplier.create({
    supplierId: id('SUP'),
    companyId,
    ...data,
    createdBy: new Types.ObjectId(userId),
  });
}

// Invoices
export async function listInvoices(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'invoices.view', companyId, userRole);
  return CompanyInvoice.find({ companyId, deletedAt: null }).sort({ createdAt: -1 });
}

export async function createInvoice(
  userId: string,
  companyId: string,
  data: { type: 'sale' | 'purchase' | 'service'; customerId?: string; supplierId?: string; lineItems: { description: string; quantity: number; unitPrice: number }[]; taxRate?: number },
  userRole?: string
) {
  await assertBusinessPermission(userId, 'invoices.create', companyId, userRole);
  const lineItems = data.lineItems.map((li) => ({
    ...li,
    total: li.quantity * li.unitPrice,
  }));
  const subtotal = lineItems.reduce((s, li) => s + li.total, 0);
  const taxAmount = subtotal * ((data.taxRate ?? 0) / 100);
  const count = await CompanyInvoice.countDocuments({ companyId });
  const invoice = await CompanyInvoice.create({
    invoiceId: id('INV'),
    companyId,
    invoiceNumber: `INV-${companyId.slice(-4)}-${String(count + 1).padStart(5, '0')}`,
    type: data.type,
    customerId: data.customerId,
    supplierId: data.supplierId,
    lineItems,
    subtotal,
    taxAmount,
    total: subtotal + taxAmount,
    status: 'draft',
    createdBy: new Types.ObjectId(userId),
  });
  await broadcastCompany(companyId, 'business:invoice:update', { invoiceId: invoice.invoiceId });
  return invoice;
}

export async function payInvoice(userId: string, companyId: string, invoiceId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'invoices.manage', companyId, userRole);
  const invoice = await CompanyInvoice.findOne({ invoiceId, companyId, deletedAt: null });
  if (!invoice) throw new Error('INVOICE_NOT_FOUND');

  if (invoice.type === 'sale') {
    await createRevenue(userId, companyId, {
      source: 'invoice',
      category: 'sales',
      amount: invoice.total,
      description: `Invoice ${invoice.invoiceNumber}`,
      customerId: invoice.customerId,
    }, userRole);
    if (invoice.customerId) {
      await CompanyCustomer.updateOne(
        { customerId: invoice.customerId },
        { $inc: { totalSpent: invoice.total, loyaltyPoints: Math.floor(invoice.total / 10) },
          $push: { purchaseHistory: { invoiceId, amount: invoice.total, date: new Date() } } }
      );
    }
  } else {
    await withdraw(companyId, invoice.total, `Invoice payment ${invoice.invoiceNumber}`, 'main', invoiceId);
  }

  invoice.status = 'paid';
  invoice.amountPaid = invoice.total;
  invoice.paidAt = new Date();
  await invoice.save();
  await broadcastCompany(companyId, 'business:invoice:update', { invoiceId, status: 'paid' });
  return invoice;
}

// Taxes
export async function listTaxes(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'taxes.view', companyId, userRole);
  return CompanyTax.find({ companyId, deletedAt: null }).sort({ dueDate: -1 });
}

export async function fileTax(userId: string, companyId: string, taxType: string, userRole?: string) {
  await assertBusinessPermission(userId, 'taxes.manage', companyId, userRole);
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');

  const taxableAmount = company.totalRevenue;
  const taxRate = 15;
  const taxAmount = taxableAmount * (taxRate / 100);
  const period = currentPeriod();

  const tax = await CompanyTax.create({
    taxId: id('TAX'),
    companyId,
    taxType,
    period,
    taxableAmount,
    taxRate,
    taxAmount,
    status: 'filed',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    filedAt: new Date(),
    createdBy: new Types.ObjectId(userId),
  });

  await broadcastCompany(companyId, 'business:government:alert', { type: 'tax_filed', taxId: tax.taxId });
  return tax;
}

export async function payTax(userId: string, companyId: string, taxId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'taxes.manage', companyId, userRole);
  const tax = await CompanyTax.findOne({ taxId, companyId, deletedAt: null });
  if (!tax) throw new Error('TAX_NOT_FOUND');
  await transferBetweenAccounts(companyId, 'main', 'tax', tax.taxAmount, `Tax payment ${tax.period}`);
  tax.status = 'paid';
  tax.paidAt = new Date();
  await tax.save();
  return tax;
}

// Loans
export async function listLoans(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'loans.view', companyId, userRole);
  return CompanyLoan.find({ companyId, deletedAt: null });
}

export async function createLoan(userId: string, companyId: string, data: { lender: string; principal: number; interestRate: number; termMonths: number }, userRole?: string) {
  await assertBusinessPermission(userId, 'loans.manage', companyId, userRole);
  const monthlyRate = data.interestRate / 100 / 12;
  const monthlyPayment = data.principal * (monthlyRate * Math.pow(1 + monthlyRate, data.termMonths)) / (Math.pow(1 + monthlyRate, data.termMonths) - 1);

  const loan = await CompanyLoan.create({
    loanId: id('LOAN'),
    companyId,
    ...data,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    remainingBalance: data.principal,
    status: 'active',
    createdBy: new Types.ObjectId(userId),
  });

  await deposit(companyId, data.principal, `Loan from ${data.lender}`, 'main', loan.loanId);
  await recalculateFinancials(companyId);
  return loan;
}

// Contracts
export async function listContracts(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'contracts.view', companyId, userRole);
  return CompanyContract.find({ companyId, deletedAt: null }).sort({ endDate: -1 });
}

export async function createContract(userId: string, companyId: string, data: Record<string, unknown>, userRole?: string) {
  await assertBusinessPermission(userId, 'contracts.manage', companyId, userRole);
  const contract = await CompanyContract.create({
    contractId: id('CTR'),
    companyId,
    ...data,
    status: 'draft',
    createdBy: new Types.ObjectId(userId),
  });
  if (contract.type === 'government') {
    await Company.updateOne({ companyId }, { $inc: { governmentContractCount: 1 } });
    await broadcastCompany(companyId, 'business:government:alert', { type: 'contract_created', contractId: contract.contractId });
  }
  await broadcastCompany(companyId, 'business:contract:update', { contractId: contract.contractId });
  return contract;
}

// Government
export async function renewLicense(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'government.licenses', companyId, userRole);
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  company.licenseExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  company.status = 'active';
  await company.save();
  await broadcastCompany(companyId, 'business:government:alert', { type: 'license_renewed', companyId });
  await broadcastCompany(companyId, 'business:status:change', { status: 'active' });
  return { licenseExpiry: company.licenseExpiry };
}

export async function scheduleInspection(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'government.inspections', companyId, userRole);
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  company.status = 'under_inspection';
  company.inspectionStatus = 'pending';
  await company.save();
  await broadcastCompany(companyId, 'business:status:change', { status: 'under_inspection' });
  return { status: company.status };
}

export async function completeInspection(userId: string, companyId: string, passed: boolean, userRole?: string) {
  await assertBusinessPermission(userId, 'government.inspections', companyId, userRole);
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  company.lastInspection = new Date();
  company.inspectionStatus = passed ? 'passed' : 'failed';
  company.status = passed ? 'active' : 'suspended';
  if (!passed) company.violations += 1;
  await company.save();
  await broadcastCompany(companyId, 'business:government:alert', { type: 'inspection_complete', passed });
  return { status: company.status, inspectionStatus: company.inspectionStatus };
}

export async function recordViolation(userId: string, companyId: string, fine: number, reason: string, userRole?: string) {
  await assertBusinessPermission(userId, 'government.violations', companyId, userRole);
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  company.violations += 1;
  company.finesOwed += fine;
  await company.save();
  await broadcastCompany(companyId, 'business:government:alert', { type: 'violation', fine, reason });
  return { violations: company.violations, finesOwed: company.finesOwed };
}

export async function suspendBusiness(userId: string, companyId: string, reason: string, userRole?: string) {
  await assertBusinessPermission(userId, 'government.violations', companyId, userRole);
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  company.status = 'suspended';
  await company.save();
  await broadcastCompany(companyId, 'business:status:change', { status: 'suspended', reason });
  return formatCompany(company);
}

// Bank
export async function getBank(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'bank.view', companyId, userRole);
  return getBankSummary(companyId);
}

export async function bankDeposit(userId: string, companyId: string, amount: number, description: string, userRole?: string) {
  await assertBusinessPermission(userId, 'bank.deposit', companyId, userRole);
  const result = await deposit(companyId, amount, description);
  await broadcastCompany(companyId, 'business:bank:transaction', result);
  return result;
}

export async function bankWithdraw(userId: string, companyId: string, amount: number, description: string, userRole?: string) {
  await assertBusinessPermission(userId, 'bank.withdraw', companyId, userRole);
  const result = await withdraw(companyId, amount, description);
  await broadcastCompany(companyId, 'business:bank:transaction', result);
  return result;
}

export async function bankTransfer(userId: string, companyId: string, from: 'main' | 'payroll' | 'tax' | 'loan', to: 'main' | 'payroll' | 'tax' | 'loan', amount: number, description: string, userRole?: string) {
  await assertBusinessPermission(userId, 'bank.transfer', companyId, userRole);
  const result = await transferBetweenAccounts(companyId, from, to, amount, description);
  await broadcastCompany(companyId, 'business:bank:transaction', result);
  return result;
}

export async function bankFreeze(userId: string, companyId: string, amount: number, reason: string, userRole?: string) {
  await assertBusinessPermission(userId, 'bank.freeze', companyId, userRole);
  return freezeFunds(companyId, amount, reason);
}

// Analytics & Reports
export async function getAnalytics(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'analytics.view', companyId, userRole);
  const analytics = await CompanyAnalytics.findOne({ companyId, period: currentPeriod() });
  if (!analytics) {
    await recalculateFinancials(companyId);
    return CompanyAnalytics.findOne({ companyId, period: currentPeriod() });
  }
  return analytics;
}

export async function getFinancialReport(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'reports.view', companyId, userRole);
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');

  const report = {
    companyId,
    period: currentPeriod(),
    revenue: company.totalRevenue,
    expenses: company.totalExpenses,
    netProfit: company.netProfit,
    operatingCost: company.operatingCost,
    payroll: company.payrollTotal,
    taxes: await CompanyTax.aggregate([
      { $match: { companyId, deletedAt: null, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$taxAmount' } } },
    ]).then((r) => r[0]?.total ?? 0),
    assets: company.totalAssets,
    inventoryValue: company.inventoryValue,
    loans: company.totalLoans,
    debt: company.totalDebt,
    cashFlow: company.availableBalance,
    monthlyIncome: company.monthlyIncome,
    yearlyIncome: company.yearlyIncome,
    generatedAt: new Date().toISOString(),
  };

  await broadcastCompany(companyId, 'business:report:ready', { type: 'financial', report });
  return report;
}

export async function getAuditLogs(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'audit.view', companyId, userRole);
  return CompanyAuditLog.find({ companyId }).sort({ createdAt: -1 }).limit(100);
}

// RBAC
export async function getRbac(userId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'rbac.configure', undefined, userRole);
  const configs = await Promise.all(
    BUSINESS_ROLES.map(async (role) => ({
      role,
      permissions: await getRolePermissions(role),
    }))
  );
  return configs;
}

export async function updateRbac(userId: string, role: BusinessRole, permissions: string[], userRole?: string) {
  await assertBusinessPermission(userId, 'rbac.configure', undefined, userRole);
  return updateRolePermissions(role, permissions as never, userId);
}

// Search
export async function search(userId: string, companyId: string, query: string, type: string, userRole?: string) {
  await assertBusinessPermission(userId, 'company.view', companyId, userRole);
  switch (type) {
    case 'identity':
      return searchIdentity(query);
    case 'customer':
      return CompanyCustomer.find({
        companyId,
        deletedAt: null,
        $or: [{ name: new RegExp(query, 'i') }, { email: new RegExp(query, 'i') }, { phone: new RegExp(query, 'i') }],
      }).limit(20);
    case 'inventory':
      return CompanyInventory.find({
        companyId,
        deletedAt: null,
        $or: [{ name: new RegExp(query, 'i') }, { sku: new RegExp(query, 'i') }],
      }).limit(20);
    case 'employee':
      return CompanyEmployee.find({ companyId, deletedAt: null }).limit(20);
    default:
      throw new Error('INVALID_SEARCH_TYPE');
  }
}

// Settings
export async function getSettings(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'company.settings', companyId, userRole);
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  return {
    settings: company.settings,
    categories: company.categories,
    availableCategories: DEFAULT_BUSINESS_CATEGORIES,
  };
}

export async function updateSettings(userId: string, companyId: string, settings: Record<string, unknown>, categories?: string[], userRole?: string) {
  await assertBusinessPermission(userId, 'company.settings', companyId, userRole);
  const updates: Record<string, unknown> = { settings, updatedBy: new Types.ObjectId(userId) };
  if (categories) updates.categories = categories;
  const company = await Company.findOneAndUpdate({ companyId, deletedAt: null }, updates, { new: true });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  return { settings: company.settings, categories: company.categories };
}

export async function listAssets(userId: string, companyId: string, userRole?: string) {
  await assertBusinessPermission(userId, 'assets.view', companyId, userRole);
  return CompanyAsset.find({ companyId, deletedAt: null });
}

export async function createAsset(userId: string, companyId: string, data: Record<string, unknown>, userRole?: string) {
  await assertBusinessPermission(userId, 'assets.manage', companyId, userRole);
  const asset = await CompanyAsset.create({
    assetId: id('AST'),
    companyId,
    currentValue: data.purchaseCost as number,
    ...data,
    createdBy: new Types.ObjectId(userId),
  });
  await recalculateFinancials(companyId);
  return asset;
}

export { checkBusinessPermission, createDigitalSignature };
