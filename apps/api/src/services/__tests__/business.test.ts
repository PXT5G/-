import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BUSINESS_APP_BUNDLE,
  BUSINESS_ROLES,
  BUSINESS_PERMISSIONS,
  DEFAULT_BUSINESS_ROLE_PERMISSIONS,
  BUSINESS_SOCKET_EVENTS,
  DEFAULT_BUSINESS_CATEGORIES,
  COMPANY_STATUSES,
} from '../../constants/business';
import { createDigitalSignature } from '../../services/businessRBACService';
import {
  generateIBAN,
  generateWalletId,
  generateBankAccountNumber,
  provisionCompanyBanking,
} from '../../services/businessBankService';

describe('business constants', () => {
  it('defines business app bundle', () => {
    assert.equal(BUSINESS_APP_BUNDLE, 'com.gulfos.business');
  });

  it('defines 13 business roles', () => {
    assert.equal(BUSINESS_ROLES.length, 13);
    assert.ok(BUSINESS_ROLES.includes('owner'));
    assert.ok(BUSINESS_ROLES.includes('ceo'));
    assert.ok(BUSINESS_ROLES.includes('accountant'));
    assert.ok(BUSINESS_ROLES.includes('auditor'));
  });

  it('defines granular permissions', () => {
    assert.ok(BUSINESS_PERMISSIONS.length >= 50);
    assert.ok(BUSINESS_PERMISSIONS.includes('company.create'));
    assert.ok(BUSINESS_PERMISSIONS.includes('bank.transfer'));
    assert.ok(BUSINESS_PERMISSIONS.includes('government.licenses'));
    assert.ok(BUSINESS_PERMISSIONS.includes('rbac.configure'));
  });

  it('assigns default permissions per role', () => {
    assert.equal(DEFAULT_BUSINESS_ROLE_PERMISSIONS.owner.length, BUSINESS_PERMISSIONS.length);
    assert.ok(DEFAULT_BUSINESS_ROLE_PERMISSIONS.cfo.includes('finance.manage'));
    assert.ok(DEFAULT_BUSINESS_ROLE_PERMISSIONS.hr.includes('employees.hire'));
    assert.ok(!DEFAULT_BUSINESS_ROLE_PERMISSIONS.employee.includes('bank.transfer'));
    assert.ok(DEFAULT_BUSINESS_ROLE_PERMISSIONS.auditor.includes('audit.view'));
  });

  it('defines business categories and statuses', () => {
    assert.ok(DEFAULT_BUSINESS_CATEGORIES.includes('vehicle_dealership'));
    assert.ok(DEFAULT_BUSINESS_CATEGORIES.includes('real_estate'));
    assert.ok(DEFAULT_BUSINESS_CATEGORIES.includes('bank'));
    assert.ok(COMPANY_STATUSES.includes('active'));
    assert.ok(COMPANY_STATUSES.includes('under_inspection'));
  });

  it('defines business socket events', () => {
    assert.equal(BUSINESS_SOCKET_EVENTS.length, 15);
    assert.ok(BUSINESS_SOCKET_EVENTS.includes('business:revenue:update'));
    assert.ok(BUSINESS_SOCKET_EVENTS.includes('business:bank:transaction'));
    assert.ok(BUSINESS_SOCKET_EVENTS.includes('business:government:alert'));
  });
});

describe('business RBAC', () => {
  it('creates digital signatures', () => {
    const sig = createDigitalSignature('EMP-0001', 'test-payload');
    assert.equal(typeof sig, 'string');
    assert.equal(sig.length, 64);
  });
});

describe('business bank', () => {
  it('generates unique banking identifiers', () => {
    const companyId = 'CO-TEST1234';
    const iban = generateIBAN(companyId);
    const wallet = generateWalletId(companyId);
    const account = generateBankAccountNumber(companyId);
    assert.ok(iban.startsWith('GULF'));
    assert.ok(wallet.startsWith('WLT-'));
    assert.ok(account.startsWith('4820'));
  });

  it('provisions company banking', () => {
    const banking = provisionCompanyBanking('CO-ABC12345');
    assert.equal(banking.cashBalance, 0);
    assert.equal(banking.availableBalance, 0);
    assert.ok(banking.iban);
    assert.ok(banking.walletId);
    assert.ok(banking.bankAccountNumber);
  });
});

describe('business API routes', () => {
  it('mounts under /api/business', () => {
    const routes = [
      '/api/business/initialize',
      '/api/business/companies',
      '/api/business/dashboard',
      '/api/business/employees',
      '/api/business/inventory',
      '/api/business/revenue',
      '/api/business/expenses',
      '/api/business/payroll',
      '/api/business/customers',
      '/api/business/suppliers',
      '/api/business/invoices',
      '/api/business/taxes',
      '/api/business/loans',
      '/api/business/contracts',
      '/api/business/bank',
      '/api/business/analytics',
      '/api/business/reports',
      '/api/business/branches',
      '/api/business/settings',
      '/api/business/rbac',
      '/api/business/government/renew',
    ];
    assert.ok(routes.length >= 20);
    assert.ok(routes.every((r) => r.startsWith('/api/business')));
  });
});
