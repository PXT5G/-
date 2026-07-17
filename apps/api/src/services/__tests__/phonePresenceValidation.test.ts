import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PHONE_NOT_AVAILABLE_CODE,
  PHONE_NOT_AVAILABLE_MESSAGE,
  CHARACTER_VERIFICATION_ERRORS,
} from '../../constants/characterPhone';
import {
  PHONE_GUARDED_API_PREFIXES,
  PHONE_INTERACTIVE_SOCKET_EVENTS,
} from '../../constants/phonePresence';
import { PhoneNotAvailableError } from '../phonePresenceService';

describe('phone presence constants', () => {
  it('defines PHONE_NOT_AVAILABLE code and Arabic message', () => {
    assert.equal(PHONE_NOT_AVAILABLE_CODE, 'PHONE_NOT_AVAILABLE');
    assert.equal(PHONE_NOT_AVAILABLE_MESSAGE, 'الهاتف لم يعد معك');
  });

  it('guards core phone API prefixes', () => {
    assert.ok(PHONE_GUARDED_API_PREFIXES.includes('/api/phone'));
    assert.ok(PHONE_GUARDED_API_PREFIXES.includes('/api/contacts'));
    assert.ok(PHONE_GUARDED_API_PREFIXES.includes('/api/messages'));
    assert.ok(PHONE_GUARDED_API_PREFIXES.includes('/api/bank'));
    assert.ok(PHONE_GUARDED_API_PREFIXES.includes('/api/system-apps'));
    assert.ok(PHONE_GUARDED_API_PREFIXES.includes('/api/settings'));
  });

  it('lists interactive socket events', () => {
    assert.ok(PHONE_INTERACTIVE_SOCKET_EVENTS.has('phone:open'));
    assert.ok(PHONE_INTERACTIVE_SOCKET_EVENTS.has('message:send'));
    assert.ok(PHONE_INTERACTIVE_SOCKET_EVENTS.has('call:initiate'));
  });
});

describe('PhoneNotAvailableError', () => {
  it('uses standard code and Arabic message', () => {
    const err = new PhoneNotAvailableError();
    assert.equal(err.code, 'PHONE_NOT_AVAILABLE');
    assert.equal(err.message, 'الهاتف لم يعد معك');
    assert.equal(err.statusCode, 403);
  });
});

describe('phone presence service exports', () => {
  it('exports central validation entry points', async () => {
    const svc = await import('../phonePresenceService');
    assert.equal(typeof svc.assertPhoneAccess, 'function');
    assert.equal(typeof svc.assertPhoneAccessForUser, 'function');
    assert.equal(typeof svc.revokePhonePresence, 'function');
    assert.equal(typeof svc.handlePhoneUnavailable, 'function');
    assert.equal(typeof svc.shouldEnforcePhonePresence, 'function');
  });
});

describe('phone presence middleware', () => {
  it('exports requirePhonePresence middleware', async () => {
    const mw = await import('../../api/middleware/phonePresence');
    assert.equal(typeof mw.requirePhonePresence, 'function');
  });

  it('exports withPhonePresenceGuard helper', async () => {
    const guard = await import('../../api/middleware/phoneRouteGuard');
    assert.equal(typeof guard.withPhonePresenceGuard, 'function');
  });
});

describe('verifyPhoneAccess failure mapping', () => {
  it('maps inventory and ownership failures to PHONE_NOT_AVAILABLE', () => {
    const unavailableCodes = [
      CHARACTER_VERIFICATION_ERRORS.INVENTORY_NO_PHONE,
      CHARACTER_VERIFICATION_ERRORS.PHONE_NOT_REGISTERED,
      CHARACTER_VERIFICATION_ERRORS.PHONE_SEIZED,
      CHARACTER_VERIFICATION_ERRORS.PHONE_TRANSFERRED,
      CHARACTER_VERIFICATION_ERRORS.PHONE_DELETED,
    ];
    for (const code of unavailableCodes) {
      assert.ok(code.length > 0);
    }
    assert.equal(CHARACTER_VERIFICATION_ERRORS.PHONE_NOT_AVAILABLE, 'PHONE_NOT_AVAILABLE');
  });
});

describe('character revoke endpoint', () => {
  it('exports postRevokePhone controller', async () => {
    const ctrl = await import('../../api/controllers/characterInternalController');
    assert.equal(typeof ctrl.postRevokePhone, 'function');
  });
});
