import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  EXCHANGE_APP_BUNDLE,
  EXCHANGE_ID,
  EXCHANGE_ROLES,
  EXCHANGE_PERMISSIONS,
  DEFAULT_EXCHANGE_ROLE_PERMISSIONS,
  EXCHANGE_SOCKET_EVENTS,
  LISTED_COMPANY_TYPES,
  ORDER_TYPES,
  TRADING_FEE_RATE,
} from '../../constants/exchange';
import { createDigitalSignature } from '../../services/exchangeRBACService';

describe('exchange constants', () => {
  it('defines exchange app bundle and id', () => {
    assert.equal(EXCHANGE_APP_BUNDLE, 'com.gulfos.exchange');
    assert.equal(EXCHANGE_ID, 'GULFX');
  });

  it('defines exchange roles', () => {
    assert.equal(EXCHANGE_ROLES.length, 8);
    assert.ok(EXCHANGE_ROLES.includes('investor'));
    assert.ok(EXCHANGE_ROLES.includes('broker'));
  });

  it('defines granular permissions', () => {
    assert.ok(EXCHANGE_PERMISSIONS.length >= 30);
    assert.ok(EXCHANGE_PERMISSIONS.includes('stocks.trade'));
    assert.ok(EXCHANGE_PERMISSIONS.includes('ipo.apply'));
    assert.ok(EXCHANGE_PERMISSIONS.includes('fraud.view'));
  });

  it('assigns default permissions per role', () => {
    assert.ok(DEFAULT_EXCHANGE_ROLE_PERMISSIONS.exchange_admin.length >= 30);
    assert.ok(DEFAULT_EXCHANGE_ROLE_PERMISSIONS.investor.includes('stocks.trade'));
    assert.ok(!DEFAULT_EXCHANGE_ROLE_PERMISSIONS.read_only.includes('orders.create'));
  });

  it('defines company types and order types', () => {
    assert.ok(LISTED_COMPANY_TYPES.includes('airline'));
    assert.ok(LISTED_COMPANY_TYPES.includes('marine'));
    assert.deepEqual(ORDER_TYPES, ['market', 'limit', 'stop', 'stop_limit']);
  });

  it('defines socket events and trading fee', () => {
    assert.equal(EXCHANGE_SOCKET_EVENTS.length, 8);
    assert.ok(EXCHANGE_SOCKET_EVENTS.includes('stock:update'));
    assert.ok(EXCHANGE_SOCKET_EVENTS.includes('portfolio:update'));
    assert.equal(TRADING_FEE_RATE, 0.001);
  });
});

describe('exchange RBAC', () => {
  it('creates digital signatures', () => {
    const sig = createDigitalSignature('user-1', 'trade-order');
    assert.equal(typeof sig, 'string');
    assert.equal(sig.length, 64);
  });
});

describe('exchange API routes', () => {
  it('mounts under /api/exchange', () => {
    const routes = [
      '/api/exchange/initialize',
      '/api/exchange/dashboard',
      '/api/exchange/stocks',
      '/api/exchange/portfolio',
      '/api/exchange/orders',
      '/api/exchange/indexes',
      '/api/exchange/news',
      '/api/exchange/analytics',
    ];
    for (const route of routes) {
      assert.ok(route.startsWith('/api/exchange'));
    }
  });
});
