import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DISCORD_DELIVERY_SKIP_REASONS,
  DISCORD_VERIFIED_SESSION_STALE_MS,
} from '../../constants/discordNotifications';

describe('discord delivery rules V1 constants', () => {
  it('defines skip reasons for offline and session failures', () => {
    assert.equal(DISCORD_DELIVERY_SKIP_REASONS.NO_VERIFIED_SESSION, 'NO_VERIFIED_SESSION');
    assert.equal(DISCORD_DELIVERY_SKIP_REASONS.PLAYER_NOT_CONNECTED, 'PLAYER_NOT_CONNECTED');
    assert.equal(DISCORD_DELIVERY_SKIP_REASONS.PHONE_ACCESS_LOCKED, 'PHONE_ACCESS_LOCKED');
    assert.equal(DISCORD_DELIVERY_SKIP_REASONS.PLAYER_OFFLINE_CANCELLED, 'PLAYER_OFFLINE_CANCELLED');
  });

  it('defines verified session stale threshold', () => {
    assert.equal(DISCORD_VERIFIED_SESSION_STALE_MS, 120_000);
  });
});

describe('DiscordVerifiedSession model', () => {
  it('exports model', async () => {
    const { DiscordVerifiedSession } = await import('../../database/models/DiscordVerifiedSession');
    assert.ok(DiscordVerifiedSession);
  });
});

describe('discord verified session service', () => {
  it('exports lifecycle handlers', async () => {
    const svc = await import('../discord/discordVerifiedSessionService');
    assert.equal(typeof svc.handlePlayerJoin, 'function');
    assert.equal(typeof svc.handlePlayerDisconnect, 'function');
    assert.equal(typeof svc.handleCharacterSwitchForDiscord, 'function');
    assert.equal(typeof svc.handlePhoneRemovedFromInventory, 'function');
    assert.equal(typeof svc.getActiveVerifiedSession, 'function');
    assert.equal(typeof svc.isPlayerActivelyConnected, 'function');
  });
});

describe('discord delivery cancel service', () => {
  it('exports cancelPendingDiscordDeliveries', async () => {
    const svc = await import('../discord/discordDeliveryCancelService');
    assert.equal(typeof svc.cancelPendingDiscordDeliveries, 'function');
  });
});

describe('discord delivery V1 routes', () => {
  it('exports session lifecycle controllers', async () => {
    const ctrl = await import('../../api/controllers/discordController');
    assert.equal(typeof ctrl.postSessionJoin, 'function');
    assert.equal(typeof ctrl.postSessionLeave, 'function');
    assert.equal(typeof ctrl.postSessionHeartbeat, 'function');
    assert.equal(typeof ctrl.postCharacterSwitch, 'function');
    assert.equal(typeof ctrl.postPhoneRemoved, 'function');
  });
});

describe('discord notification provider V1 behavior', () => {
  it('documents no-queue-on-failure in provider', async () => {
    const { discordNotificationProvider } = await import('../discord/discordNotificationProvider');
    assert.equal(discordNotificationProvider.id, 'discord');
    assert.equal(typeof discordNotificationProvider.deliver, 'function');
  });
});
