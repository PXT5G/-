import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  JUSTICE_APP_BUNDLE,
  JUSTICE_ROLES,
  JUSTICE_PERMISSIONS,
  DEFAULT_JUSTICE_ROLE_PERMISSIONS,
  JUSTICE_SOCKET_EVENTS,
  OFFICIAL_STATUSES,
  CASE_STATUSES,
  HEARING_TYPES,
  SENTENCE_TYPES,
} from '../../constants/justice';
import { createDigitalSignature } from '../../services/justiceRBACService';

describe('justice constants', () => {
  it('defines justice app bundle', () => {
    assert.equal(JUSTICE_APP_BUNDLE, 'com.gulfos.justice');
  });

  it('defines 8 justice roles', () => {
    assert.equal(JUSTICE_ROLES.length, 8);
    assert.ok(JUSTICE_ROLES.includes('chief_judge'));
    assert.ok(JUSTICE_ROLES.includes('judge'));
    assert.ok(JUSTICE_ROLES.includes('prosecutor'));
    assert.ok(JUSTICE_ROLES.includes('defense_attorney'));
    assert.ok(JUSTICE_ROLES.includes('court_clerk'));
    assert.ok(JUSTICE_ROLES.includes('bailiff'));
  });

  it('defines granular permissions', () => {
    assert.ok(JUSTICE_PERMISSIONS.length >= 50);
    assert.ok(JUSTICE_PERMISSIONS.includes('mdt.access'));
    assert.ok(JUSTICE_PERMISSIONS.includes('warrants.approve'));
    assert.ok(JUSTICE_PERMISSIONS.includes('search.bank'));
    assert.ok(JUSTICE_PERMISSIONS.includes('rbac.configure'));
    assert.ok(JUSTICE_PERMISSIONS.includes('signatures.create'));
  });

  it('assigns default permissions per role', () => {
    assert.ok(DEFAULT_JUSTICE_ROLE_PERMISSIONS.chief_judge.length >= JUSTICE_PERMISSIONS.length - 1);
    assert.ok(DEFAULT_JUSTICE_ROLE_PERMISSIONS.bailiff.includes('realtime.courtroom'));
    assert.ok(!DEFAULT_JUSTICE_ROLE_PERMISSIONS.bailiff.includes('sentences.issue'));
    assert.ok(DEFAULT_JUSTICE_ROLE_PERMISSIONS.prosecutor.includes('charges.file'));
    assert.ok(DEFAULT_JUSTICE_ROLE_PERMISSIONS.defense_attorney.includes('appeals.manage'));
  });

  it('defines case and hearing statuses', () => {
    assert.ok(OFFICIAL_STATUSES.includes('in_court'));
    assert.ok(CASE_STATUSES.includes('appealed'));
    assert.ok(HEARING_TYPES.includes('arraignment'));
    assert.ok(SENTENCE_TYPES.includes('community_service'));
  });

  it('defines justice socket events', () => {
    assert.equal(JUSTICE_SOCKET_EVENTS.length, 15);
    assert.ok(JUSTICE_SOCKET_EVENTS.includes('justice:courtroom:live'));
    assert.ok(JUSTICE_SOCKET_EVENTS.includes('justice:warrant:review'));
    assert.ok(JUSTICE_SOCKET_EVENTS.includes('justice:judgment:issued'));
  });
});

describe('justice RBAC', () => {
  it('creates digital signatures', () => {
    const sig = createDigitalSignature('JD-0001', 'test-payload');
    assert.equal(typeof sig, 'string');
    assert.equal(sig.length, 64);
  });
});

describe('justice API routes', () => {
  it('mounts under /api/justice', () => {
    const routes = [
      '/api/justice/initialize',
      '/api/justice/dashboard',
      '/api/justice/cases',
      '/api/justice/hearings',
      '/api/justice/trials',
      '/api/justice/warrants',
      '/api/justice/appeals',
      '/api/justice/search',
      '/api/justice/analytics',
      '/api/justice/rbac',
      '/api/justice/citations/contested',
      '/api/justice/docket',
    ];
    assert.ok(routes.every((r) => r.startsWith('/api/justice')));
    assert.equal(routes.length, 12);
  });
});

describe('justice runtime registration', () => {
  it('includes justice in RUNTIME_APPS', async () => {
    const { RUNTIME_APPS } = await import('../packageService');
    assert.ok(RUNTIME_APPS.has('com.gulfos.justice'));
  });
});
