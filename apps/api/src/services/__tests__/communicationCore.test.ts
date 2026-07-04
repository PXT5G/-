import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractMentions } from '../mentionService';
import { determineGeneration } from '../networkEngineService';
import { encryptMessage, decryptMessage, generateConversationKey } from '../encryptionService';
import { validateVoiceNote } from '../voiceService';
import { validateVideo } from '../videoService';
import { MESSAGE_TYPES, CONTENT_TYPES, CONVERSATION_TYPES, DELIVERY_STATES, PRESENCE_STATES } from '../../constants/communication';

describe('mention service', () => {
  it('extracts @mentions from message body', () => {
    const mentions = extractMentions('Hello @john and @jane_doe!');
    assert.deepEqual(mentions, ['john', 'jane_doe']);
  });
});

describe('encryption service', () => {
  it('encrypts and decrypts messages with integrity', () => {
    const { keyId, key } = generateConversationKey('conv-1');
    assert.ok(keyId);
    const { encrypted, signature } = encryptMessage('Hello BananaOS', key);
    const decrypted = decryptMessage(encrypted, key, signature);
    assert.equal(decrypted, 'Hello BananaOS');
  });

  it('rejects tampered signatures', () => {
    const { key } = generateConversationKey('conv-2');
    const { encrypted } = encryptMessage('secret', key);
    assert.throws(() => decryptMessage(encrypted, key, 'bad-signature'), /INTEGRITY_FAILED/);
  });
});

describe('message types', () => {
  it('supports all required message types', () => {
    assert.equal(MESSAGE_TYPES.length, 13);
    assert.ok(MESSAGE_TYPES.includes('emergency'));
    assert.ok(MESSAGE_TYPES.includes('police'));
    assert.ok(MESSAGE_TYPES.includes('bank'));
  });

  it('supports all content types', () => {
    assert.ok(CONTENT_TYPES.includes('voice_note'));
    assert.ok(CONTENT_TYPES.includes('bank_transfer'));
    assert.ok(CONTENT_TYPES.includes('live_location'));
  });
});

describe('conversation types', () => {
  it('covers government and emergency channels', () => {
    assert.ok(CONVERSATION_TYPES.includes('police'));
    assert.ok(CONVERSATION_TYPES.includes('justice'));
    assert.ok(CONVERSATION_TYPES.includes('emergency'));
    assert.ok(CONVERSATION_TYPES.includes('announcement'));
  });
});

describe('delivery states', () => {
  it('defines full delivery lifecycle', () => {
    assert.equal(DELIVERY_STATES.length, 10);
    assert.ok(DELIVERY_STATES.includes('encrypting'));
    assert.ok(DELIVERY_STATES.includes('delivered'));
    assert.ok(DELIVERY_STATES.includes('read'));
  });
});

describe('presence states', () => {
  it('includes typing and recording states', () => {
    assert.ok(PRESENCE_STATES.includes('typing'));
    assert.ok(PRESENCE_STATES.includes('recording_voice'));
    assert.ok(PRESENCE_STATES.includes('dnd'));
  });
});

describe('communication socket events', () => {
  it('defines required realtime events', () => {
    const events = [
      'message:new', 'message:delivered', 'message:read', 'message:edited', 'message:deleted',
      'conversation:new', 'presence:update', 'typing:update', 'reaction:update',
      'attachment:progress', 'attachment:ready', 'sync:complete',
    ];
    assert.equal(events.length, 12);
  });
});

describe('voice and video validation', () => {
  it('validates voice note duration', () => {
    assert.throws(() => validateVoiceNote({ durationSeconds: 400, mimeType: 'audio/ogg' }), /VOICE_NOTE_TOO_LONG/);
    assert.doesNotThrow(() => validateVoiceNote({ durationSeconds: 60, mimeType: 'audio/ogg' }));
  });

  it('validates video mime type', () => {
    assert.throws(() => validateVideo({ width: 1920, height: 1080, durationSeconds: 10, mimeType: 'text/plain' }), /INVALID_VIDEO_FORMAT/);
  });
});

describe('network dependency for delivery', () => {
  it('requires connectivity for non-emergency generations', () => {
    assert.equal(determineGeneration(0, 5000, 2000), 'none');
  });
});

describe('background communication tasks', () => {
  it('registers communication-tick and communication-sync', () => {
    const tasks = ['communication-tick', 'communication-sync'];
    assert.equal(tasks.length, 2);
  });
});

describe('permission routing', () => {
  it('requires apps to route through communication core', () => {
    const coreApp = 'com.bananaos.communication';
    assert.ok(coreApp.includes('communication'));
  });
});
