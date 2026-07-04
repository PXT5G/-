import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAT_APP_BUNDLE,
  CHAT_ROLES,
  CHAT_PERMISSIONS,
  DEFAULT_CHAT_ROLE_PERMISSIONS,
  CHAT_SOCKET_EVENTS,
  CHAT_CONVERSATION_KINDS,
  CHAT_CALL_TYPES,
  CHAT_GROUP_ROLES,
  CHAT_STICKER_PACKS,
} from '../../constants/chat';
import { generateInviteCode, buildContactCard, buildLocationShare } from '../../services/chatIntegrationService';

describe('chat constants', () => {
  it('defines chat app bundle', () => {
    assert.equal(CHAT_APP_BUNDLE, 'com.gulfos.chat');
  });

  it('defines chat roles', () => {
    assert.equal(CHAT_ROLES.length, 4);
    assert.ok(CHAT_ROLES.includes('user'));
    assert.ok(CHAT_ROLES.includes('admin'));
  });

  it('defines granular permissions', () => {
    assert.ok(CHAT_PERMISSIONS.length >= 40);
    assert.ok(CHAT_PERMISSIONS.includes('chats.private'));
    assert.ok(CHAT_PERMISSIONS.includes('calls.video'));
    assert.ok(CHAT_PERMISSIONS.includes('messages.polls'));
    assert.ok(CHAT_PERMISSIONS.includes('privacy.biometric'));
  });

  it('assigns default permissions per role', () => {
    assert.ok(DEFAULT_CHAT_ROLE_PERMISSIONS.user.includes('chat.access'));
    assert.ok(!DEFAULT_CHAT_ROLE_PERMISSIONS.user.includes('calls.record'));
    assert.ok(DEFAULT_CHAT_ROLE_PERMISSIONS.admin.includes('audit.view'));
  });

  it('defines conversation kinds', () => {
    assert.ok(CHAT_CONVERSATION_KINDS.includes('channel'));
    assert.ok(CHAT_CONVERSATION_KINDS.includes('community'));
    assert.ok(CHAT_CONVERSATION_KINDS.includes('broadcast'));
  });

  it('defines group roles including guest', () => {
    assert.ok(CHAT_GROUP_ROLES.includes('guest'));
    assert.ok(CHAT_GROUP_ROLES.includes('owner'));
  });

  it('defines call types', () => {
    assert.ok(CHAT_CALL_TYPES.includes('voice'));
    assert.ok(CHAT_CALL_TYPES.includes('conference'));
  });

  it('defines sticker packs', () => {
    assert.ok(CHAT_STICKER_PACKS.length >= 3);
  });

  it('defines chat socket events', () => {
    assert.ok(CHAT_SOCKET_EVENTS.includes('chat:call:ringing'));
    assert.ok(CHAT_SOCKET_EVENTS.includes('chat:message:request'));
  });
});

describe('chat integration helpers', () => {
  it('generates invite codes', () => {
    const code = generateInviteCode();
    assert.ok(code.length >= 10);
  });

  it('builds contact cards', () => {
    const card = buildContactCard('user-1', 'Test User', '+1234');
    assert.equal(card.type, 'contact');
    assert.ok(card.deepLink.includes('gulfos://chat'));
  });

  it('builds location shares', () => {
    const loc = buildLocationShare(25.0, 55.0, 'Dubai');
    assert.equal(loc.type, 'location');
    assert.ok(loc.mapsDeepLink.includes('gulfos://maps'));
  });
});

describe('chat API routes', () => {
  it('mounts under /api/chat', () => {
    const routes = [
      '/api/chat/initialize',
      '/api/chat/inbox',
      '/api/chat/conversations/private',
      '/api/chat/messages',
      '/api/chat/calls',
      '/api/chat/privacy',
    ];
    assert.ok(routes.every((r) => r.startsWith('/api/chat')));
  });
});
