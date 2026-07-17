import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DISCORD_PROVIDER_ID,
  DISCORD_EMBED_COLORS,
  DISCORD_NOTIFICATION_CATEGORIES,
  DISCORD_NOTIFICATION_CATEGORY_GROUPS,
} from '../../constants/discordNotifications';
import { sanitizeForDiscord } from '../discord/discordPrivacyService';
import { buildDiscordEmbed } from '../discord/discordEmbedService';
import { isWithinQuietHours, shouldDeliverDuringQuietHours } from '../discord/discordQuietHoursService';

describe('discord notification constants', () => {
  it('defines provider id and embed colors', () => {
    assert.equal(DISCORD_PROVIDER_ID, 'discord');
    assert.equal(DISCORD_EMBED_COLORS.critical, 0xed4245);
    assert.equal(DISCORD_EMBED_COLORS.high, 0xfaa61a);
    assert.equal(DISCORD_EMBED_COLORS.normal, 0x5865f2);
    assert.equal(DISCORD_EMBED_COLORS.low, 0x99aab5);
  });

  it('defines all notification category groups', () => {
    assert.ok(DISCORD_NOTIFICATION_CATEGORY_GROUPS.communication.includes('incoming_call'));
    assert.ok(DISCORD_NOTIFICATION_CATEGORY_GROUPS.banking.includes('money_received'));
    assert.ok(DISCORD_NOTIFICATION_CATEGORY_GROUPS.security.includes('phone_removed'));
    assert.equal(
      DISCORD_NOTIFICATION_CATEGORIES.length,
      Object.values(DISCORD_NOTIFICATION_CATEGORY_GROUPS).flat().length
    );
  });
});

describe('discord privacy sanitizer', () => {
  it('redacts sensitive patterns', () => {
    const text = 'Your balance: $12,345.67 and OTP: 123456';
    const sanitized = sanitizeForDiscord(text);
    assert.ok(!sanitized.includes('12,345'));
    assert.ok(!sanitized.includes('123456'));
    assert.ok(sanitized.includes('[redacted]'));
  });
});

describe('discord embed builder', () => {
  it('builds premium embed with character and priority', () => {
    const payload = buildDiscordEmbed({
      context: {
        userId: 'u1',
        appId: 'com.gulfos.messages',
        notificationId: 'n1',
        queueId: 'q1',
        title: 'New SMS',
        body: 'Hello from Gulf City',
        priority: 'normal',
        payload: {},
        icon: 'https://example.com/icon.png',
      },
      category: 'sms_message',
      characterName: 'Ahmed',
      phoneNumber: '+971500000001',
      appName: 'Messages',
      sanitizedTitle: 'New SMS',
      sanitizedBody: 'Hello from Gulf City',
    });

    const embeds = payload.embeds as Record<string, unknown>[];
    assert.ok(embeds.length === 1);
    assert.equal((embeds[0] as { title: string }).title, 'New SMS');
    assert.equal((embeds[0] as { color: number }).color, DISCORD_EMBED_COLORS.normal);
  });

  it('builds grouped summary embed', () => {
    const payload = buildDiscordEmbed({
      context: {
        userId: 'u1',
        appId: 'com.gulfos.system',
        notificationId: 'n1',
        queueId: 'q1',
        title: '8 New Notifications',
        body: '',
        priority: 'normal',
        payload: {},
      },
      category: 'app_notification',
      characterName: 'Ahmed',
      appName: 'GULFOS',
      sanitizedTitle: '8 New Notifications',
      sanitizedBody: '',
      groupedSummary: {
        total: 8,
        lines: ['3 SMS Messages', '2 Bank Updates', '1 Missed Call', '2 App Notifications'],
      },
    });

    const embeds = payload.embeds as { description: string }[];
    assert.ok(embeds[0].description.includes('8 New Notifications'));
    assert.ok(embeds[0].description.includes('SMS Messages'));
  });
});

describe('discord quiet hours', () => {
  it('blocks non-critical during quiet hours when criticalOnly', () => {
    const quietHours = {
      enabled: true,
      startTime: '00:00',
      endTime: '23:59',
      criticalOnly: true,
      muteAll: false,
      timezone: 'UTC',
    };
    assert.equal(shouldDeliverDuringQuietHours(quietHours, 'normal'), false);
    assert.equal(shouldDeliverDuringQuietHours(quietHours, 'critical'), true);
  });

  it('detects quiet hours window', () => {
    const quietHours = {
      enabled: true,
      startTime: '22:00',
      endTime: '07:00',
      criticalOnly: true,
      muteAll: false,
      timezone: 'UTC',
    };
    const lateNight = new Date('2026-01-15T23:00:00Z');
    assert.equal(isWithinQuietHours(quietHours, lateNight), true);
  });
});

describe('discord models', () => {
  it('exports Discord models', async () => {
    const { DiscordLink } = await import('../../database/models/DiscordLink');
    const { DiscordNotificationOutbox } = await import('../../database/models/DiscordNotificationOutbox');
    const { DiscordNotificationPreferences } = await import('../../database/models/DiscordNotificationPreferences');
    assert.ok(DiscordLink);
    assert.ok(DiscordNotificationOutbox);
    assert.ok(DiscordNotificationPreferences);
  });
});

describe('discord notification provider', () => {
  it('registers as discord channel provider', async () => {
    const { discordNotificationProvider } = await import('../discord/discordNotificationProvider');
    assert.equal(discordNotificationProvider.id, 'discord');
    assert.equal(discordNotificationProvider.channel, 'discord');
    assert.equal(typeof discordNotificationProvider.isEnabled, 'function');
    assert.equal(typeof discordNotificationProvider.deliver, 'function');
  });
});

describe('discord routes', () => {
  it('mounts internal and user discord routes', async () => {
    const internal = await import('../../api/routes/discordInternal');
    const user = await import('../../api/routes/discord');
    assert.ok(internal.default);
    assert.ok(user.default);
  });
});
