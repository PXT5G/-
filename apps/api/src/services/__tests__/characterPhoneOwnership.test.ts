import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHARACTER_HEADERS,
  CHARACTER_SOCKET_EVENTS,
  CHARACTER_VERIFICATION_ERRORS,
  CHARACTER_PLATFORMS,
} from '../../constants/characterPhone';

describe('character phone constants', () => {
  it('defines required request headers', () => {
    assert.equal(CHARACTER_HEADERS.EXTERNAL_USER_ID, 'x-external-user-id');
    assert.equal(CHARACTER_HEADERS.CHARACTER_ID, 'x-character-id');
    assert.equal(CHARACTER_HEADERS.CHARACTER_SESSION_ID, 'x-character-session-id');
    assert.equal(CHARACTER_HEADERS.INVENTORY_SESSION_ID, 'x-inventory-session-id');
    assert.equal(CHARACTER_HEADERS.PHONE_ID, 'x-phone-id');
    assert.equal(CHARACTER_HEADERS.DEVICE_ID, 'x-device-id');
  });

  it('defines supported platforms', () => {
    assert.ok(CHARACTER_PLATFORMS.includes('discord'));
    assert.ok(CHARACTER_PLATFORMS.includes('simulator'));
  });

  it('defines socket events', () => {
    assert.ok(CHARACTER_SOCKET_EVENTS.includes('character:changed'));
    assert.ok(CHARACTER_SOCKET_EVENTS.includes('character:session:ended'));
    assert.ok(CHARACTER_SOCKET_EVENTS.includes('character:phone:activated'));
  });

  it('defines verification error codes', () => {
    assert.equal(CHARACTER_VERIFICATION_ERRORS.USER_NOT_LINKED, 'CHARACTER_USER_NOT_LINKED');
    assert.equal(CHARACTER_VERIFICATION_ERRORS.PHONE_ID_MISMATCH, 'PHONE_ID_MISMATCH');
    assert.equal(CHARACTER_VERIFICATION_ERRORS.INVENTORY_NO_PHONE, 'INVENTORY_PHONE_ITEM_MISSING');
  });
});

describe('character phone models', () => {
  it('exports Character model', async () => {
    const { Character } = await import('../../database/models/Character');
    assert.ok(Character);
  });

  it('exports CharacterPhone model', async () => {
    const { CharacterPhone } = await import('../../database/models/CharacterPhone');
    assert.ok(CharacterPhone);
  });

  it('exports CharacterSession model', async () => {
    const { CharacterSession } = await import('../../database/models/CharacterSession');
    assert.ok(CharacterSession);
  });

  it('exports ExternalAccountLink model', async () => {
    const { ExternalAccountLink } = await import('../../database/models/ExternalAccountLink');
    assert.ok(ExternalAccountLink);
  });

  it('exports InventoryAttestation model', async () => {
    const { InventoryAttestation } = await import('../../database/models/InventoryAttestation');
    assert.ok(InventoryAttestation);
  });
});

describe('character internal routes', () => {
  it('mounts character routes under internal API', async () => {
    const routes = await import('../../api/routes/internal');
    assert.ok(routes.default);
  });

  it('exports character internal controller handlers', async () => {
    const ctrl = await import('../../api/controllers/characterInternalController');
    assert.equal(typeof ctrl.postCharacterChanged, 'function');
    assert.equal(typeof ctrl.postVerifyPhone, 'function');
    assert.equal(typeof ctrl.postBindPhone, 'function');
  });
});

describe('character context middleware', () => {
  it('parses headers into character context', async () => {
    const { parseCharacterContext } = await import('../../api/middleware/characterContext');
    const req = {
      headers: {
        'x-platform': 'discord',
        'x-external-user-id': 'user-123',
        'x-character-id': 'char-456',
        'x-inventory-session-id': 'inv-789',
        'x-phone-id': 'phone-abc',
        'x-device-id': 'device-def',
      },
      body: {},
    } as unknown as import('express').Request;

    const ctx = parseCharacterContext(req);
    assert.ok(ctx);
    assert.equal(ctx!.platform, 'discord');
    assert.equal(ctx!.externalUserId, 'user-123');
    assert.equal(ctx!.externalCharacterId, 'char-456');
    assert.equal(ctx!.inventorySessionId, 'inv-789');
    assert.equal(ctx!.phoneId, 'phone-abc');
    assert.equal(ctx!.deviceId, 'device-def');
  });

  it('returns null when required fields missing', async () => {
    const { parseCharacterContext } = await import('../../api/middleware/characterContext');
    const req = { headers: { 'x-external-user-id': 'only-user' }, body: {} } as unknown as import('express').Request;
    assert.equal(parseCharacterContext(req), null);
  });
});

describe('phone scope service', () => {
  it('builds phone-scoped filter from verification result', async () => {
    const { scopeFromVerification, phoneScopedFilter } = await import('../phoneScopeService');
    const scope = scopeFromVerification({
      verified: true,
      platform: 'discord',
      externalUserId: 'u1',
      externalCharacterId: 'c1',
      characterRecordId: 'CHR-1',
      phoneId: 'PHONE-1',
      deviceUuid: 'DEV-1',
      phoneNumber: '+971500000099',
      gulfosUserId: '507f1f77bcf86cd799439011',
    });
    assert.equal(scope.phoneId, 'PHONE-1');
    assert.deepEqual(phoneScopedFilter(scope), { phoneId: 'PHONE-1' });
  });
});

describe('character phone service exports', () => {
  it('exports verification and binding functions', async () => {
    const svc = await import('../characterPhoneService');
    assert.equal(typeof svc.verifyPhoneAccess, 'function');
    assert.equal(typeof svc.bindCharacterPhone, 'function');
    assert.equal(typeof svc.linkExternalAccount, 'function');
    assert.equal(typeof svc.storeInventoryAttestation, 'function');
  });
});

describe('character session service exports', () => {
  it('exports session lifecycle functions', async () => {
    const svc = await import('../characterSessionService');
    assert.equal(typeof svc.openCharacterSession, 'function');
    assert.equal(typeof svc.handleCharacterChanged, 'function');
    assert.equal(typeof svc.endActiveSessionsForUser, 'function');
  });
});

describe('shared socket events', () => {
  it('includes character socket event names', () => {
    const events = [
      'character:changed',
      'character:session:ended',
      'character:phone:activated',
    ];
    assert.equal(events.length, 3);
    assert.ok(CHARACTER_SOCKET_EVENTS.includes('character:changed'));
  });
});
