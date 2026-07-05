import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PHONE_APP_BUNDLE,
  CALL_STATUSES,
  CALL_DIRECTIONS,
  EMERGENCY_NUMBERS,
  PHONE_SOCKET_EVENTS,
} from '../../constants/telephony';
import { CONTACTS_APP_BUNDLE, CONTACT_CATEGORIES } from '../../constants/contacts';
import { MESSAGES_APP_BUNDLE } from '../../constants/messagesApp';
import { MAIL_APP_BUNDLE, MAIL_FOLDERS } from '../../constants/mail';
import { SIM_APP_BUNDLE, NETWORK_GENERATIONS } from '../../constants/sim';

describe('telephony constants', () => {
  it('defines phone app bundle', () => {
    assert.equal(PHONE_APP_BUNDLE, 'com.gulfos.phone');
  });

  it('defines call statuses', () => {
    assert.ok(CALL_STATUSES.includes('ringing'));
    assert.ok(CALL_STATUSES.includes('connected'));
    assert.ok(CALL_STATUSES.includes('missed'));
  });

  it('defines call directions', () => {
    assert.deepEqual([...CALL_DIRECTIONS], ['incoming', 'outgoing']);
  });

  it('defines emergency numbers', () => {
    assert.ok(EMERGENCY_NUMBERS.includes('911'));
  });

  it('defines phone socket events', () => {
    assert.ok(PHONE_SOCKET_EVENTS.includes('phone:incoming'));
    assert.ok(PHONE_SOCKET_EVENTS.includes('phone:ended'));
  });
});

describe('contacts constants', () => {
  it('defines contact categories', () => {
    assert.ok(CONTACT_CATEGORIES.includes('police'));
    assert.ok(CONTACT_CATEGORIES.includes('emergency'));
    assert.equal(CONTACTS_APP_BUNDLE, 'com.gulfos.contacts');
  });
});

describe('messages constants', () => {
  it('defines messages app bundle', () => {
    assert.equal(MESSAGES_APP_BUNDLE, 'com.gulfos.messages');
  });
});

describe('mail constants', () => {
  it('defines mail folders', () => {
    assert.ok(MAIL_FOLDERS.includes('inbox'));
    assert.equal(MAIL_APP_BUNDLE, 'com.gulfos.mail');
  });
});

describe('sim constants', () => {
  it('defines network generations', () => {
    assert.ok(NETWORK_GENERATIONS.includes('5g'));
    assert.equal(SIM_APP_BUNDLE, 'com.gulfos.sim');
  });
});

describe('core phone app routes', () => {
  it('mounts phone routes', async () => {
    const routes = await import('../../api/routes/phone');
    assert.ok(routes.default);
  });

  it('mounts contacts routes', async () => {
    const routes = await import('../../api/routes/contacts');
    assert.ok(routes.default);
  });

  it('mounts messages routes', async () => {
    const routes = await import('../../api/routes/messages');
    assert.ok(routes.default);
  });

  it('mounts mail routes', async () => {
    const routes = await import('../../api/routes/mail');
    assert.ok(routes.default);
  });

  it('mounts sim routes', async () => {
    const routes = await import('../../api/routes/sim');
    assert.ok(routes.default);
  });

  it('exports call engine service', async () => {
    const svc = await import('../../services/callEngineService');
    assert.equal(typeof svc.initiateCall, 'function');
    assert.equal(typeof svc.cleanupStaleCalls, 'function');
  });

  it('exports contacts service', async () => {
    const svc = await import('../../services/contactsService');
    assert.equal(typeof svc.initializeContacts, 'function');
    assert.equal(typeof svc.mergeContacts, 'function');
  });
});
