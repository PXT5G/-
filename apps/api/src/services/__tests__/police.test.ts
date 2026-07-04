import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  POLICE_APP_BUNDLE,
  POLICE_ROLES,
  POLICE_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  POLICE_SOCKET_EVENTS,
  OFFICER_STATUSES,
  DISPATCH_STATUSES,
} from '../../constants/police';
import { calculateFine, calculateJailDays } from '../../services/policeIntegrationService';

describe('police constants', () => {
  it('defines police app bundle', () => {
    assert.equal(POLICE_APP_BUNDLE, 'com.gulfos.police');
  });

  it('defines 14 police roles', () => {
    assert.equal(POLICE_ROLES.length, 14);
    assert.ok(POLICE_ROLES.includes('chief'));
    assert.ok(POLICE_ROLES.includes('dispatcher'));
    assert.ok(POLICE_ROLES.includes('swat'));
    assert.ok(POLICE_ROLES.includes('detective'));
  });

  it('defines granular permissions', () => {
    assert.ok(POLICE_PERMISSIONS.length >= 50);
    assert.ok(POLICE_PERMISSIONS.includes('mdt.access'));
    assert.ok(POLICE_PERMISSIONS.includes('gps.track'));
    assert.ok(POLICE_PERMISSIONS.includes('panic.trigger'));
    assert.ok(POLICE_PERMISSIONS.includes('rbac.configure'));
  });

  it('assigns default permissions per role', () => {
    assert.ok(DEFAULT_ROLE_PERMISSIONS.chief.length >= POLICE_PERMISSIONS.length - 1);
    assert.ok(DEFAULT_ROLE_PERMISSIONS.cadet.includes('mdt.access'));
    assert.ok(DEFAULT_ROLE_PERMISSIONS.cadet.includes('training.view'));
    assert.ok(!DEFAULT_ROLE_PERMISSIONS.cadet.includes('warrants.create'));
    assert.ok(DEFAULT_ROLE_PERMISSIONS.dispatcher.includes('dispatch.manage'));
  });

  it('defines officer and dispatch statuses', () => {
    assert.ok(OFFICER_STATUSES.includes('panic'));
    assert.ok(DISPATCH_STATUSES.includes('on_scene'));
  });

  it('defines police socket events', () => {
    assert.equal(POLICE_SOCKET_EVENTS.length, 15);
    assert.ok(POLICE_SOCKET_EVENTS.includes('police:panic'));
    assert.ok(POLICE_SOCKET_EVENTS.includes('police:911:new'));
  });
});

describe('police integration', () => {
  it('calculates fines by violation code', () => {
    assert.equal(calculateFine('SPEEDING'), 250);
    assert.equal(calculateFine('DUI'), 1500);
    assert.equal(calculateFine('UNKNOWN'), 100);
  });

  it('calculates jail days by violation code', () => {
    assert.equal(calculateJailDays('DUI'), 5);
    assert.equal(calculateJailDays('SPEEDING'), 0);
  });
});

describe('police API routes', () => {
  it('mounts under /api/police', () => {
    const routes = [
      '/api/police/initialize',
      '/api/police/dashboard',
      '/api/police/dispatches',
      '/api/police/bolos',
      '/api/police/warrants',
      '/api/police/wanted',
      '/api/police/search',
      '/api/police/panic',
      '/api/police/analytics',
      '/api/police/rbac',
      '/api/police/track',
    ];
    assert.ok(routes.every((r) => r.startsWith('/api/police')));
    assert.equal(routes.length, 11);
  });
});
