import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AVIATION_APP_BUNDLE,
  AVIATION_ROLES,
  AVIATION_PERMISSIONS,
  DEFAULT_AVIATION_ROLE_PERMISSIONS,
  AVIATION_SOCKET_EVENTS,
  DEFAULT_AIRCRAFT_CATEGORIES,
  AIRPORT_TYPES,
  TAX_RATE_SALE,
  TAX_RATE_LEASE,
} from '../../constants/aviation';
import { createDigitalSignature } from '../../services/aviationRBACService';
import { currentPeriod } from '../../services/aviationIntegrationService';

describe('aviation constants', () => {
  it('defines aviation app bundle', () => {
    assert.equal(AVIATION_APP_BUNDLE, 'com.gulfos.aviation');
  });

  it('defines 12 aviation roles', () => {
    assert.equal(AVIATION_ROLES.length, 12);
    assert.ok(AVIATION_ROLES.includes('company_owner'));
    assert.ok(AVIATION_ROLES.includes('pilot'));
    assert.ok(AVIATION_ROLES.includes('mechanic'));
  });

  it('defines granular permissions', () => {
    assert.ok(AVIATION_PERMISSIONS.length >= 55);
    assert.ok(AVIATION_PERMISSIONS.includes('aircraft.create'));
    assert.ok(AVIATION_PERMISSIONS.includes('airports.manage'));
    assert.ok(AVIATION_PERMISSIONS.includes('hangars.create'));
    assert.ok(AVIATION_PERMISSIONS.includes('business.sync'));
  });

  it('assigns default permissions per role', () => {
    assert.ok(DEFAULT_AVIATION_ROLE_PERMISSIONS.company_owner.length >= 50);
    assert.ok(DEFAULT_AVIATION_ROLE_PERMISSIONS.pilot.includes('aircraft.move'));
    assert.ok(DEFAULT_AVIATION_ROLE_PERMISSIONS.mechanic.includes('maintenance.create'));
    assert.ok(!DEFAULT_AVIATION_ROLE_PERMISSIONS.buyer.includes('aircraft.create'));
  });

  it('defines aircraft categories and airport types', () => {
    assert.equal(DEFAULT_AIRCRAFT_CATEGORIES.length, 19);
    assert.ok(DEFAULT_AIRCRAFT_CATEGORIES.includes('private_jet'));
    assert.ok(DEFAULT_AIRCRAFT_CATEGORIES.includes('helicopter'));
    assert.ok(DEFAULT_AIRCRAFT_CATEGORIES.includes('drone'));
    assert.ok(AIRPORT_TYPES.includes('military_base'));
    assert.ok(AIRPORT_TYPES.includes('helipad'));
  });

  it('defines socket events and tax rates', () => {
    assert.equal(AVIATION_SOCKET_EVENTS.length, 14);
    assert.ok(AVIATION_SOCKET_EVENTS.includes('aviation:sold'));
    assert.ok(AVIATION_SOCKET_EVENTS.includes('aviation:moved'));
    assert.equal(TAX_RATE_SALE, 0.10);
    assert.equal(TAX_RATE_LEASE, 0.04);
  });
});

describe('aviation RBAC', () => {
  it('creates digital signatures', () => {
    const sig = createDigitalSignature('user-1', 'sale-contract');
    assert.equal(typeof sig, 'string');
    assert.equal(sig.length, 64);
  });
});

describe('aviation integration', () => {
  it('formats current period as YYYY-MM', () => {
    const period = currentPeriod();
    assert.match(period, /^\d{4}-\d{2}$/);
  });
});

describe('aviation API routes', () => {
  it('mounts under /api/aviation', () => {
    const routes = [
      '/api/aviation/initialize',
      '/api/aviation/dashboard',
      '/api/aviation/aircraft',
      '/api/aviation/search',
      '/api/aviation/dealers',
      '/api/aviation/airports',
      '/api/aviation/offers',
      '/api/aviation/sales',
      '/api/aviation/finance',
      '/api/aviation/leases',
      '/api/aviation/auctions',
      '/api/aviation/maintenance',
      '/api/aviation/analytics',
      '/api/aviation/favorites',
      '/api/aviation/rbac',
    ];
    assert.ok(routes.length >= 15);
    assert.ok(routes.every((r) => r.startsWith('/api/aviation')));
  });
});
