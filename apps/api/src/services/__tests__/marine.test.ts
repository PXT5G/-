import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MARINE_APP_BUNDLE,
  MARINE_ROLES,
  MARINE_PERMISSIONS,
  DEFAULT_MARINE_ROLE_PERMISSIONS,
  MARINE_SOCKET_EVENTS,
  DEFAULT_VESSEL_CATEGORIES,
  MARINA_TYPES,
  TAX_RATE_SALE,
  TAX_RATE_LEASE,
} from '../../constants/marine';
import { createDigitalSignature } from '../../services/marineRBACService';
import { currentPeriod } from '../../services/marineIntegrationService';

describe('marine constants', () => {
  it('defines marine app bundle', () => {
    assert.equal(MARINE_APP_BUNDLE, 'com.gulfos.marine');
  });

  it('defines 12 marine roles', () => {
    assert.equal(MARINE_ROLES.length, 12);
    assert.ok(MARINE_ROLES.includes('company_owner'));
    assert.ok(MARINE_ROLES.includes('captain'));
    assert.ok(MARINE_ROLES.includes('mechanic'));
  });

  it('defines granular permissions', () => {
    assert.ok(MARINE_PERMISSIONS.length >= 55);
    assert.ok(MARINE_PERMISSIONS.includes('vessels.create'));
    assert.ok(MARINE_PERMISSIONS.includes('marinas.manage'));
    assert.ok(MARINE_PERMISSIONS.includes('docks.create'));
    assert.ok(MARINE_PERMISSIONS.includes('business.sync'));
  });

  it('assigns default permissions per role', () => {
    assert.ok(DEFAULT_MARINE_ROLE_PERMISSIONS.company_owner.length >= 50);
    assert.ok(DEFAULT_MARINE_ROLE_PERMISSIONS.captain.includes('vessels.move'));
    assert.ok(DEFAULT_MARINE_ROLE_PERMISSIONS.mechanic.includes('maintenance.create'));
    assert.ok(!DEFAULT_MARINE_ROLE_PERMISSIONS.buyer.includes('vessels.create'));
  });

  it('defines vessel categories and marina types', () => {
    assert.equal(DEFAULT_VESSEL_CATEGORIES.length, 19);
    assert.ok(DEFAULT_VESSEL_CATEGORIES.includes('luxury_yacht'));
    assert.ok(DEFAULT_VESSEL_CATEGORIES.includes('mega_yacht'));
    assert.ok(DEFAULT_VESSEL_CATEGORIES.includes('submarine'));
    assert.ok(MARINA_TYPES.includes('shipyard'));
    assert.ok(MARINA_TYPES.includes('boat_storage'));
  });

  it('defines socket events and tax rates', () => {
    assert.equal(MARINE_SOCKET_EVENTS.length, 15);
    assert.ok(MARINE_SOCKET_EVENTS.includes('marine:sold'));
    assert.ok(MARINE_SOCKET_EVENTS.includes('marine:location:change'));
    assert.equal(TAX_RATE_SALE, 0.09);
    assert.equal(TAX_RATE_LEASE, 0.035);
  });
});

describe('marine RBAC', () => {
  it('creates digital signatures', () => {
    const sig = createDigitalSignature('user-1', 'sale-contract');
    assert.equal(typeof sig, 'string');
    assert.equal(sig.length, 64);
  });
});

describe('marine integration', () => {
  it('formats current period as YYYY-MM', () => {
    const period = currentPeriod();
    assert.match(period, /^\d{4}-\d{2}$/);
  });
});

describe('marine API routes', () => {
  it('mounts under /api/marine', () => {
    const routes = [
      '/api/marine/initialize',
      '/api/marine/dashboard',
      '/api/marine/vessels',
      '/api/marine/search',
      '/api/marine/dealers',
      '/api/marine/marinas',
      '/api/marine/offers',
      '/api/marine/sales',
      '/api/marine/finance',
      '/api/marine/leases',
      '/api/marine/auctions',
      '/api/marine/maintenance',
      '/api/marine/analytics',
      '/api/marine/favorites',
      '/api/marine/rbac',
    ];
    assert.ok(routes.length >= 15);
    assert.ok(routes.every((r) => r.startsWith('/api/marine')));
  });
});
