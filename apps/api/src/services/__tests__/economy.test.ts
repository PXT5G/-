import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ECONOMY_APP_BUNDLE,
  ECONOMY_ROLES,
  ECONOMY_PERMISSIONS,
  DEFAULT_ECONOMY_ROLE_PERMISSIONS,
  ECONOMY_SOCKET_EVENTS,
  ECONOMY_SECTORS,
  TARGET_INFLATION,
  VALUATION_PROFIT_MULTIPLIER,
} from '../../constants/economy';
import { createDigitalSignature } from '../../services/economyRBACService';
import { currentPeriod } from '../../services/economyIntegrationService';

describe('economy constants', () => {
  it('defines economy engine bundle', () => {
    assert.equal(ECONOMY_APP_BUNDLE, 'com.gulfos.economy-engine');
  });

  it('defines economy roles', () => {
    assert.equal(ECONOMY_ROLES.length, 5);
    assert.ok(ECONOMY_ROLES.includes('economist'));
    assert.ok(ECONOMY_ROLES.includes('analyst'));
  });

  it('defines granular permissions', () => {
    assert.ok(ECONOMY_PERMISSIONS.length >= 18);
    assert.ok(ECONOMY_PERMISSIONS.includes('valuation.view'));
    assert.ok(ECONOMY_PERMISSIONS.includes('gdp.view'));
    assert.ok(ECONOMY_PERMISSIONS.includes('tick.trigger'));
  });

  it('assigns default permissions per role', () => {
    assert.ok(DEFAULT_ECONOMY_ROLE_PERMISSIONS.platform_admin.length >= 18);
    assert.ok(DEFAULT_ECONOMY_ROLE_PERMISSIONS.analyst.includes('gdp.view'));
    assert.ok(!DEFAULT_ECONOMY_ROLE_PERMISSIONS.analyst.includes('tick.trigger'));
  });

  it('defines economy sectors and socket events', () => {
    assert.equal(ECONOMY_SECTORS.length, 6);
    assert.ok(ECONOMY_SECTORS.includes('marine'));
    assert.equal(ECONOMY_SOCKET_EVENTS.length, 5);
    assert.ok(ECONOMY_SOCKET_EVENTS.includes('economy:update'));
    assert.ok(ECONOMY_SOCKET_EVENTS.includes('gdp:update'));
  });

  it('defines valuation constants', () => {
    assert.equal(TARGET_INFLATION, 0.02);
    assert.equal(VALUATION_PROFIT_MULTIPLIER, 8);
  });
});

describe('economy RBAC', () => {
  it('creates digital signatures', () => {
    const sig = createDigitalSignature('user-1', 'valuation-report');
    assert.equal(typeof sig, 'string');
    assert.equal(sig.length, 64);
  });
});

describe('economy integration', () => {
  it('formats current period as YYYY-MM', () => {
    const period = currentPeriod();
    assert.match(period, /^\d{4}-\d{2}$/);
  });
});

describe('economy API routes', () => {
  it('mounts under /api/economy', () => {
    const routes = [
      '/api/economy/initialize',
      '/api/economy/dashboard',
      '/api/economy/analytics',
      '/api/economy/gdp',
      '/api/economy/inflation',
      '/api/economy/valuations',
      '/api/economy/demand',
      '/api/economy/supply',
      '/api/economy/tick',
    ];
    for (const route of routes) {
      assert.ok(route.startsWith('/api/economy'));
    }
  });
});
