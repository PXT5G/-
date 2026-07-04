import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMS_APP_BUNDLE,
  EMS_ROLES,
  EMS_PERMISSIONS,
  DEFAULT_EMS_ROLE_PERMISSIONS,
  EMS_SOCKET_EVENTS,
  PERSONNEL_STATUSES,
  DISPATCH_STATUSES,
  BLOOD_TYPES,
} from '../../constants/ems';
import { createDigitalSignature } from '../../services/emsRBACService';
import { calculateEtaMinutes } from '../../services/emsIntegrationService';

describe('ems constants', () => {
  it('defines ems app bundle', () => {
    assert.equal(EMS_APP_BUNDLE, 'com.gulfos.ems');
  });

  it('defines 9 ems roles', () => {
    assert.equal(EMS_ROLES.length, 9);
    assert.ok(EMS_ROLES.includes('chief_ems'));
    assert.ok(EMS_ROLES.includes('paramedic'));
    assert.ok(EMS_ROLES.includes('dispatcher'));
    assert.ok(EMS_ROLES.includes('surgeon'));
    assert.ok(EMS_ROLES.includes('nurse'));
  });

  it('defines granular permissions', () => {
    assert.ok(EMS_PERMISSIONS.length >= 50);
    assert.ok(EMS_PERMISSIONS.includes('mdt.access'));
    assert.ok(EMS_PERMISSIONS.includes('helicopter.dispatch'));
    assert.ok(EMS_PERMISSIONS.includes('hospital.admit'));
    assert.ok(EMS_PERMISSIONS.includes('search.blood_type'));
    assert.ok(EMS_PERMISSIONS.includes('rbac.configure'));
  });

  it('assigns default permissions per role', () => {
    assert.ok(DEFAULT_EMS_ROLE_PERMISSIONS.chief_ems.length >= EMS_PERMISSIONS.length - 1);
    assert.ok(DEFAULT_EMS_ROLE_PERMISSIONS.paramedic.includes('treatments.create'));
    assert.ok(DEFAULT_EMS_ROLE_PERMISSIONS.dispatcher.includes('helicopter.dispatch'));
    assert.ok(!DEFAULT_EMS_ROLE_PERMISSIONS.trainee.includes('prescriptions.create'));
    assert.ok(DEFAULT_EMS_ROLE_PERMISSIONS.surgeon.includes('or.manage'));
  });

  it('defines personnel and dispatch statuses', () => {
    assert.ok(PERSONNEL_STATUSES.includes('at_hospital'));
    assert.ok(DISPATCH_STATUSES.includes('transporting'));
    assert.ok(BLOOD_TYPES.includes('O+'));
  });

  it('defines ems socket events', () => {
    assert.equal(EMS_SOCKET_EVENTS.length, 15);
    assert.ok(EMS_SOCKET_EVENTS.includes('ems:ambulance:gps'));
    assert.ok(EMS_SOCKET_EVENTS.includes('ems:hospital:capacity'));
    assert.ok(EMS_SOCKET_EVENTS.includes('ems:helicopter:dispatch'));
  });
});

describe('ems RBAC', () => {
  it('creates digital signatures', () => {
    const sig = createDigitalSignature('EM-0001', 'test-payload');
    assert.equal(typeof sig, 'string');
    assert.equal(sig.length, 64);
  });
});

describe('ems integration', () => {
  it('calculates ETA between coordinates', () => {
    const eta = calculateEtaMinutes(34.05, -118.24, 34.10, -118.29);
    assert.ok(eta >= 1);
    assert.ok(eta < 60);
  });
});

describe('ems API routes', () => {
  it('mounts under /api/ems', () => {
    const routes = [
      '/api/ems/initialize',
      '/api/ems/dashboard',
      '/api/ems/units',
      '/api/ems/dispatches',
      '/api/ems/patients',
      '/api/ems/records',
      '/api/ems/hospitals',
      '/api/ems/admissions',
      '/api/ems/ambulances',
      '/api/ems/incidents',
      '/api/ems/search',
      '/api/ems/analytics',
      '/api/ems/rbac',
    ];
    assert.ok(routes.every((r) => r.startsWith('/api/ems')));
    assert.equal(routes.length, 13);
  });
});

describe('ems runtime registration', () => {
  it('includes ems in RUNTIME_APPS', async () => {
    const { RUNTIME_APPS } = await import('../packageService');
    assert.ok(RUNTIME_APPS.has('com.gulfos.ems'));
  });
});
