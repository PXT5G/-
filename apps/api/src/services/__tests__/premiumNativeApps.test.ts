import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BANK_APP_BUNDLE,
  BANK_ROLES,
  BANK_PERMISSIONS,
  DEFAULT_BANK_ROLE_PERMISSIONS,
  BANK_SOCKET_EVENTS,
  ACCOUNT_TYPES,
  CARD_TYPES,
  TRANSACTION_TYPES,
} from '../../constants/bank';
import {
  IDENTITY_APP_BUNDLE,
  IDENTITY_ROLES,
  IDENTITY_PERMISSIONS,
  DEFAULT_IDENTITY_ROLE_PERMISSIONS,
  IDENTITY_SOCKET_EVENTS,
  DOCUMENT_TYPES,
} from '../../constants/identity';
import {
  generatePersonalIBAN,
  generateWalletId,
  generateAccountNumber,
  generateCardLastFour,
} from '../../services/bankRBACService';
import {
  generateNationalId,
  generateQrCode,
  createDigitalSignature,
} from '../../services/identityRBACService';

describe('bank constants', () => {
  it('defines bank app bundle', () => {
    assert.equal(BANK_APP_BUNDLE, 'com.gulfos.bank');
  });

  it('defines bank roles and permissions', () => {
    assert.ok(BANK_ROLES.includes('account_holder'));
    assert.ok(BANK_PERMISSIONS.includes('transfers.internal'));
    assert.ok(BANK_PERMISSIONS.includes('cards.freeze'));
    assert.equal(DEFAULT_BANK_ROLE_PERMISSIONS.account_holder.length, BANK_PERMISSIONS.length);
  });

  it('defines account and card types', () => {
    assert.ok(ACCOUNT_TYPES.includes('checking'));
    assert.ok(CARD_TYPES.includes('debit'));
    assert.ok(TRANSACTION_TYPES.includes('transfer_out'));
  });

  it('defines bank socket events', () => {
    assert.ok(BANK_SOCKET_EVENTS.includes('bank:transfer'));
    assert.ok(BANK_SOCKET_EVENTS.includes('bank:update'));
  });
});

describe('identity constants', () => {
  it('defines identity app bundle', () => {
    assert.equal(IDENTITY_APP_BUNDLE, 'com.gulfos.identity');
  });

  it('defines identity roles and permissions', () => {
    assert.ok(IDENTITY_ROLES.includes('citizen'));
    assert.ok(IDENTITY_PERMISSIONS.includes('qr.generate'));
    assert.ok(DEFAULT_IDENTITY_ROLE_PERMISSIONS.citizen.includes('profile.view'));
  });

  it('defines document types', () => {
    assert.ok(DOCUMENT_TYPES.includes('national_id'));
    assert.ok(DOCUMENT_TYPES.includes('passport'));
    assert.ok(DOCUMENT_TYPES.includes('driving_license'));
  });

  it('defines identity socket events', () => {
    assert.ok(IDENTITY_SOCKET_EVENTS.includes('identity:verified'));
    assert.ok(IDENTITY_SOCKET_EVENTS.includes('identity:update'));
  });
});

describe('bank RBAC helpers', () => {
  it('generates consistent IBAN for user', () => {
    const iban1 = generatePersonalIBAN('user123');
    const iban2 = generatePersonalIBAN('user123');
    assert.equal(iban1, iban2);
    assert.ok(iban1.startsWith('GULF'));
  });

  it('generates wallet and account numbers', () => {
    assert.ok(generateWalletId('user1').startsWith('WLT-P'));
    assert.ok(generateAccountNumber('user1').startsWith('6200'));
    assert.match(generateCardLastFour(), /^\d{4}$/);
  });
});

describe('identity RBAC helpers', () => {
  it('generates national ID', () => {
    const id = generateNationalId('user123');
    assert.ok(id.startsWith('GULF-'));
  });

  it('generates QR code and digital signature', () => {
    const qr = generateQrCode('ID-TEST');
    assert.ok(qr.length === 64);
    const sig = createDigitalSignature('ID-TEST', 'test data');
    assert.ok(sig.length === 64);
  });
});

describe('premium native app routes', () => {
  it('mounts bank routes', async () => {
    const routes = await import('../../api/routes/bank');
    assert.ok(routes.default);
  });

  it('mounts identity routes', async () => {
    const routes = await import('../../api/routes/identity');
    assert.ok(routes.default);
  });
});
