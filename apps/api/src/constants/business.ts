/** GULF Business Platform — com.gulfos.business constants */

export const BUSINESS_APP_BUNDLE = 'com.gulfos.business' as const;

export const DEFAULT_BUSINESS_CATEGORIES = [
  'vehicle_dealership', 'aircraft_dealership', 'marine_dealership', 'real_estate',
  'construction', 'fuel', 'restaurant', 'cafe', 'hotel', 'hospital', 'pharmacy',
  'bank', 'insurance', 'technology', 'electronics', 'clothing', 'jewelry',
  'supermarket', 'factory', 'logistics', 'taxi', 'delivery', 'media', 'mining',
  'farming', 'government_contractor', 'security', 'import_export', 'investment', 'other',
] as const;

export type BusinessCategory = (typeof DEFAULT_BUSINESS_CATEGORIES)[number] | string;

export const COMPANY_STATUSES = ['pending', 'active', 'suspended', 'under_inspection', 'closed', 'dissolved'] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export const BUSINESS_ROLES = [
  'owner', 'ceo', 'cfo', 'coo', 'manager', 'supervisor', 'accountant',
  'hr', 'sales', 'warehouse', 'employee', 'contractor', 'auditor',
] as const;

export type BusinessRole = (typeof BUSINESS_ROLES)[number];

export const BUSINESS_PERMISSIONS = [
  'platform.access', 'dashboard.view', 'analytics.view', 'reports.view', 'reports.export',
  'company.view', 'company.create', 'company.manage', 'company.settings',
  'branches.view', 'branches.manage', 'departments.view', 'departments.manage',
  'employees.view', 'employees.hire', 'employees.manage', 'employees.terminate',
  'employees.promote', 'employees.suspend', 'employees.attendance', 'employees.payroll',
  'finance.view', 'finance.manage', 'revenue.view', 'revenue.create', 'revenue.manage',
  'expenses.view', 'expenses.create', 'expenses.manage', 'payroll.view', 'payroll.process',
  'taxes.view', 'taxes.manage', 'loans.view', 'loans.manage', 'assets.view', 'assets.manage',
  'bank.view', 'bank.transfer', 'bank.withdraw', 'bank.deposit', 'bank.freeze',
  'inventory.view', 'inventory.manage', 'inventory.transfer', 'inventory.returns',
  'warehouses.view', 'warehouses.manage', 'products.view', 'products.manage',
  'customers.view', 'customers.manage', 'customers.blacklist',
  'suppliers.view', 'suppliers.manage', 'suppliers.contracts',
  'invoices.view', 'invoices.create', 'invoices.manage', 'contracts.view', 'contracts.manage',
  'government.view', 'government.licenses', 'government.inspections', 'government.contracts',
  'government.taxes', 'government.violations', 'categories.manage',
  'rbac.configure', 'audit.view', 'signatures.create', 'notifications.send',
] as const;

export type BusinessPermission = (typeof BUSINESS_PERMISSIONS)[number];

export const EMPLOYEE_STATUSES = ['active', 'probation', 'suspended', 'terminated', 'on_leave'] as const;
export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'partial', 'overdue', 'voided'] as const;
export const PAYROLL_STATUSES = ['pending', 'processed', 'paid', 'failed'] as const;
export const LOAN_STATUSES = ['active', 'paid', 'defaulted', 'restructured'] as const;
export const CONTRACT_STATUSES = ['draft', 'active', 'expired', 'terminated'] as const;
export const INVENTORY_STATUSES = ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'] as const;

export const DEFAULT_BUSINESS_ROLE_PERMISSIONS: Record<BusinessRole, BusinessPermission[]> = {
  owner: [...BUSINESS_PERMISSIONS],
  ceo: BUSINESS_PERMISSIONS.filter((p) => p !== 'rbac.configure'),
  cfo: BUSINESS_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'analytics.view', 'reports.view', 'reports.export',
      'company.view', 'finance.view', 'finance.manage', 'revenue.view', 'revenue.create', 'revenue.manage',
      'expenses.view', 'expenses.create', 'expenses.manage', 'payroll.view', 'payroll.process',
      'taxes.view', 'taxes.manage', 'loans.view', 'loans.manage', 'assets.view', 'assets.manage',
      'bank.view', 'bank.transfer', 'bank.withdraw', 'bank.deposit', 'invoices.view', 'invoices.create',
      'invoices.manage', 'contracts.view', 'contracts.manage', 'audit.view', 'signatures.create'].includes(p)
  ),
  coo: BUSINESS_PERMISSIONS.filter((p) =>
    !['rbac.configure', 'bank.freeze', 'government.violations', 'employees.terminate'].includes(p)
  ),
  manager: BUSINESS_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'analytics.view', 'company.view', 'branches.view',
      'departments.view', 'employees.view', 'employees.manage', 'employees.attendance',
      'inventory.view', 'inventory.manage', 'customers.view', 'customers.manage',
      'suppliers.view', 'invoices.view', 'invoices.create', 'reports.view'].includes(p)
  ),
  supervisor: BUSINESS_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'employees.view', 'employees.attendance',
      'inventory.view', 'inventory.manage', 'customers.view', 'warehouses.view'].includes(p)
  ),
  accountant: BUSINESS_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'analytics.view', 'finance.view', 'revenue.view',
      'expenses.view', 'payroll.view', 'taxes.view', 'invoices.view', 'invoices.create',
      'bank.view', 'reports.view', 'reports.export'].includes(p)
  ),
  hr: BUSINESS_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'employees.view', 'employees.hire', 'employees.manage',
      'employees.promote', 'employees.suspend', 'employees.attendance', 'departments.view',
      'departments.manage'].includes(p)
  ),
  sales: BUSINESS_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'customers.view', 'customers.manage',
      'invoices.view', 'invoices.create', 'inventory.view', 'products.view'].includes(p)
  ),
  warehouse: BUSINESS_PERMISSIONS.filter((p) =>
    ['platform.access', 'inventory.view', 'inventory.manage', 'inventory.transfer',
      'inventory.returns', 'warehouses.view', 'products.view'].includes(p)
  ),
  employee: ['platform.access', 'dashboard.view', 'company.view', 'employees.attendance'],
  contractor: ['platform.access', 'dashboard.view', 'invoices.view'],
  auditor: BUSINESS_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'analytics.view', 'reports.view', 'reports.export',
      'company.view', 'finance.view', 'revenue.view', 'expenses.view', 'payroll.view',
      'taxes.view', 'audit.view', 'bank.view'].includes(p)
  ),
};

export const BUSINESS_SOCKET_EVENTS = [
  'business:initialized', 'business:company:update', 'business:revenue:update',
  'business:expense:update', 'business:payroll:update', 'business:inventory:update',
  'business:employee:update', 'business:report:ready', 'business:notification',
  'business:bank:transaction', 'business:status:change', 'business:analytics:update',
  'business:invoice:update', 'business:contract:update', 'business:government:alert',
] as const;
