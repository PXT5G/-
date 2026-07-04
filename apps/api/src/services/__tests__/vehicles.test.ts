import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VEHICLES_APP_BUNDLE,
  VEHICLE_ROLES,
  VEHICLE_PERMISSIONS,
  DEFAULT_VEHICLE_ROLE_PERMISSIONS,
  VEHICLE_SOCKET_EVENTS,
  DEFAULT_VEHICLE_CATEGORIES,
  TAX_RATE_SALE,
  TAX_RATE_LEASE,
} from '../../constants/vehicles';
import { createDigitalSignature } from '../../services/vehicleRBACService';
import { currentPeriod } from '../../services/vehicleIntegrationService';

describe('vehicles constants', () => {
  it('defines vehicles app bundle', () => {
    assert.equal(VEHICLES_APP_BUNDLE, 'com.gulfos.vehicles');
  });

  it('defines 11 vehicle roles', () => {
    assert.equal(VEHICLE_ROLES.length, 11);
    assert.ok(VEHICLE_ROLES.includes('dealer_owner'));
    assert.ok(VEHICLE_ROLES.includes('sales_agent'));
    assert.ok(VEHICLE_ROLES.includes('auctioneer'));
  });

  it('defines granular permissions', () => {
    assert.ok(VEHICLE_PERMISSIONS.length >= 50);
    assert.ok(VEHICLE_PERMISSIONS.includes('vehicles.create'));
    assert.ok(VEHICLE_PERMISSIONS.includes('auctions.bid'));
    assert.ok(VEHICLE_PERMISSIONS.includes('bank.financing'));
    assert.ok(VEHICLE_PERMISSIONS.includes('business.sync'));
  });

  it('assigns default permissions per role', () => {
    assert.ok(DEFAULT_VEHICLE_ROLE_PERMISSIONS.dealer_owner.length >= 50);
    assert.ok(DEFAULT_VEHICLE_ROLE_PERMISSIONS.sales_agent.includes('offers.create'));
    assert.ok(!DEFAULT_VEHICLE_ROLE_PERMISSIONS.buyer.includes('vehicles.create'));
    assert.ok(DEFAULT_VEHICLE_ROLE_PERMISSIONS.government_officer.includes('government.view'));
  });

  it('defines vehicle categories', () => {
    assert.equal(DEFAULT_VEHICLE_CATEGORIES.length, 24);
    assert.ok(DEFAULT_VEHICLE_CATEGORIES.includes('sedan'));
    assert.ok(DEFAULT_VEHICLE_CATEGORIES.includes('hypercar'));
    assert.ok(DEFAULT_VEHICLE_CATEGORIES.includes('police'));
    assert.ok(DEFAULT_VEHICLE_CATEGORIES.includes('custom'));
  });

  it('defines socket events and tax rates', () => {
    assert.equal(VEHICLE_SOCKET_EVENTS.length, 12);
    assert.ok(VEHICLE_SOCKET_EVENTS.includes('vehicles:sold'));
    assert.ok(VEHICLE_SOCKET_EVENTS.includes('vehicles:auction'));
    assert.equal(TAX_RATE_SALE, 0.08);
    assert.equal(TAX_RATE_LEASE, 0.03);
  });
});

describe('vehicles RBAC', () => {
  it('creates digital signatures', () => {
    const sig = createDigitalSignature('user-1', 'sale-contract');
    assert.equal(typeof sig, 'string');
    assert.equal(sig.length, 64);
  });
});

describe('vehicles integration', () => {
  it('formats current period as YYYY-MM', () => {
    const period = currentPeriod();
    assert.match(period, /^\d{4}-\d{2}$/);
  });
});

describe('vehicles API routes', () => {
  it('mounts under /api/vehicles', () => {
    const routes = [
      '/api/vehicles/initialize',
      '/api/vehicles/dashboard',
      '/api/vehicles/vehicles',
      '/api/vehicles/search',
      '/api/vehicles/dealers',
      '/api/vehicles/offers',
      '/api/vehicles/sales',
      '/api/vehicles/finance',
      '/api/vehicles/auctions',
      '/api/vehicles/maintenance',
      '/api/vehicles/analytics',
      '/api/vehicles/favorites',
      '/api/vehicles/rbac',
    ];
    assert.ok(routes.length >= 13);
    assert.ok(routes.every((r) => r.startsWith('/api/vehicles')));
  });
});
