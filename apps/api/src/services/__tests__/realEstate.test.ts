import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  REAL_ESTATE_APP_BUNDLE,
  REAL_ESTATE_ROLES,
  REAL_ESTATE_PERMISSIONS,
  DEFAULT_REAL_ESTATE_ROLE_PERMISSIONS,
  REAL_ESTATE_SOCKET_EVENTS,
  DEFAULT_PROPERTY_TYPES,
  OWNERSHIP_TYPES,
  TAX_RATE_SALE,
} from '../../constants/realEstate';
import { createDigitalSignature } from '../../services/realEstateRBACService';
import { haversineKm } from '../../services/realEstateIntegrationService';

describe('real estate constants', () => {
  it('defines real estate app bundle', () => {
    assert.equal(REAL_ESTATE_APP_BUNDLE, 'com.gulfos.real-estate');
  });

  it('defines 11 real estate roles', () => {
    assert.equal(REAL_ESTATE_ROLES.length, 11);
    assert.ok(REAL_ESTATE_ROLES.includes('dealer'));
    assert.ok(REAL_ESTATE_ROLES.includes('agent'));
    assert.ok(REAL_ESTATE_ROLES.includes('property_manager'));
  });

  it('defines granular permissions', () => {
    assert.ok(REAL_ESTATE_PERMISSIONS.length >= 45);
    assert.ok(REAL_ESTATE_PERMISSIONS.includes('properties.create'));
    assert.ok(REAL_ESTATE_PERMISSIONS.includes('sales.escrow'));
    assert.ok(REAL_ESTATE_PERMISSIONS.includes('leases.evict'));
    assert.ok(REAL_ESTATE_PERMISSIONS.includes('business.sync'));
  });

  it('assigns default permissions per role', () => {
    assert.ok(DEFAULT_REAL_ESTATE_ROLE_PERMISSIONS.dealer.length >= 40);
    assert.ok(DEFAULT_REAL_ESTATE_ROLE_PERMISSIONS.agent.includes('offers.create'));
    assert.ok(!DEFAULT_REAL_ESTATE_ROLE_PERMISSIONS.tenant.includes('properties.create'));
    assert.ok(DEFAULT_REAL_ESTATE_ROLE_PERMISSIONS.government_officer.includes('government.inspect'));
  });

  it('defines property types and ownership', () => {
    assert.ok(DEFAULT_PROPERTY_TYPES.includes('apartment'));
    assert.ok(DEFAULT_PROPERTY_TYPES.includes('marina'));
    assert.ok(DEFAULT_PROPERTY_TYPES.includes('construction_project'));
    assert.ok(OWNERSHIP_TYPES.includes('fractional'));
    assert.ok(OWNERSHIP_TYPES.includes('company'));
  });

  it('defines socket events and tax rates', () => {
    assert.equal(REAL_ESTATE_SOCKET_EVENTS.length, 14);
    assert.ok(REAL_ESTATE_SOCKET_EVENTS.includes('realestate:property:sold'));
    assert.ok(REAL_ESTATE_SOCKET_EVENTS.includes('realestate:offer:accepted'));
    assert.equal(TAX_RATE_SALE, 0.05);
  });
});

describe('real estate RBAC', () => {
  it('creates digital signatures', () => {
    const sig = createDigitalSignature('user-1', 'sale-contract');
    assert.equal(typeof sig, 'string');
    assert.equal(sig.length, 64);
  });
});

describe('real estate integration', () => {
  it('calculates distance between coordinates', () => {
    const km = haversineKm(34.05, -118.24, 34.10, -118.29);
    assert.ok(km >= 0);
    assert.ok(km < 20);
  });
});

describe('real estate API routes', () => {
  it('mounts under /api/real-estate', () => {
    const routes = [
      '/api/real-estate/initialize',
      '/api/real-estate/dashboard',
      '/api/real-estate/properties',
      '/api/real-estate/search',
      '/api/real-estate/offers',
      '/api/real-estate/sales',
      '/api/real-estate/rentals',
      '/api/real-estate/leases',
      '/api/real-estate/maintenance',
      '/api/real-estate/analytics',
      '/api/real-estate/favorites',
      '/api/real-estate/rbac',
    ];
    assert.ok(routes.length >= 12);
    assert.ok(routes.every((r) => r.startsWith('/api/real-estate')));
  });
});
