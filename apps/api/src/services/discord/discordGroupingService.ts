import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { DiscordNotificationBatch } from '../../database/models/DiscordNotificationBatch';
import { DiscordNotificationOutbox } from '../../database/models/DiscordNotificationOutbox';
import {
  DISCORD_GROUPING_WINDOW_MS,
  type DiscordNotificationCategory,
} from '../../constants/discordNotifications';
import { buildDiscordEmbed, outboxId, batchId } from './discordEmbedService';
import { sanitizeNotificationContent } from './discordPrivacyService';
import { resolveAppName } from './discordEmbedService';
import type { NotificationDeliveryContext } from '../../constants/notificationProviders';
import type { DiscordDeliveryDecision } from './discordDeliveryService';

const CATEGORY_LABELS: Partial<Record<DiscordNotificationCategory, string>> = {
  sms_message: 'SMS Messages',
  transfer: 'Bank Updates',
  missed_call: 'Missed Calls',
  app_notification: 'App Notifications',
  mail: 'Mail',
  incoming_call: 'Incoming Calls',
};

function categoryLabel(category: DiscordNotificationCategory): string {
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ');
}

export async function enqueueForDiscordGrouping(input: {
  context: NotificationDeliveryContext;
  decision: DiscordDeliveryDecision;
}): Promise<{ grouped: boolean; outboxId?: string }> {
  const { context, decision } = input;
  if (!decision.deliver || !decision.discordUserId || !decision.externalCharacterId || !decision.category) {
    return { grouped: false };
  }

  const existing = await DiscordNotificationBatch.findOne({
    gulfosUserId: new Types.ObjectId(context.userId),
    externalCharacterId: decision.externalCharacterId,
    flushed: false,
    flushAt: { $gt: new Date() },
  });

  const item = {
    notificationId: context.notificationId,
    queueId: context.queueId,
    category: decision.category,
    title: context.title,
    priority: context.priority,
    appId: context.appId,
  };

  if (existing && existing.items.length > 0) {
    existing.items.push(item);
    await existing.save();
    return { grouped: true };
  }

  const flushAt = new Date(Date.now() + DISCORD_GROUPING_WINDOW_MS);
  await DiscordNotificationBatch.create({
    batchId: batchId(),
    gulfosUserId: new Types.ObjectId(context.userId),
    externalCharacterId: decision.externalCharacterId,
    discordUserId: decision.discordUserId,
    items: [item],
    windowStartedAt: new Date(),
    flushAt,
    flushed: false,
  });

  return { grouped: true };
}

export async function flushExpiredDiscordBatches(): Promise<number> {
  const due = await DiscordNotificationBatch.find({
    flushed: false,
    flushAt: { $lte: new Date() },
  }).limit(50);

  let flushed = 0;
  for (const batch of due) {
    await flushBatch(batch);
    flushed += 1;
  }
  return flushed;
}

async function flushBatch(batch: InstanceType<typeof DiscordNotificationBatch>): Promise<void> {
  if (batch.items.length === 0) {
    batch.flushed = true;
    await batch.save();
    return;
  }

  const link = await import('../../database/models/DiscordLink').then((m) =>
    m.DiscordLink.findOne({ discordUserId: batch.discordUserId })
  );

  if (batch.items.length === 1) {
    const item = batch.items[0];
    const sanitized = sanitizeNotificationContent({ title: item.title, body: item.title });
    const embedPayload = buildDiscordEmbed({
      context: {
        userId: batch.gulfosUserId.toString(),
        appId: item.appId,
        notificationId: item.notificationId,
        queueId: item.queueId,
        title: sanitized.title,
        body: sanitized.body,
        priority: item.priority,
        payload: {},
        category: item.category,
      },
      category: item.category,
      characterName: 'Character',
      appName: resolveAppName(item.appId),
      sanitizedTitle: sanitized.title,
      sanitizedBody: sanitized.body,
    });

    await DiscordNotificationOutbox.create({
      outboxId: outboxId(),
      gulfosUserId: batch.gulfosUserId,
      discordUserId: batch.discordUserId,
      dmChannelId: link?.dmChannelId,
      externalCharacterId: batch.externalCharacterId,
      category: item.category,
      priority: item.priority,
      notificationId: item.notificationId,
      queueId: item.queueId,
      embedPayload,
      status: 'pending',
    });
  } else {
    const counts = new Map<string, number>();
    for (const item of batch.items) {
      const label = categoryLabel(item.category);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    const lines = Array.from(counts.entries()).map(([label, count]) => `${count} ${label}`);
    const highestPriority = batch.items.some((i) => i.priority === 'critical')
      ? 'critical'
      : batch.items.some((i) => i.priority === 'high')
        ? 'high'
        : 'normal';

    const embedPayload = buildDiscordEmbed({
      context: {
        userId: batch.gulfosUserId.toString(),
        appId: 'com.gulfos.system',
        notificationId: batch.items[0].notificationId,
        queueId: batch.items[0].queueId,
        title: `${batch.items.length} New Notifications`,
        body: lines.join('\n'),
        priority: highestPriority,
        payload: {},
        category: 'app_notification',
      },
      category: 'app_notification',
      characterName: 'Character',
      appName: 'GULFOS',
      sanitizedTitle: `${batch.items.length} New Notifications`,
      sanitizedBody: lines.join('\n'),
      groupedSummary: { total: batch.items.length, lines },
    });

    await DiscordNotificationOutbox.create({
      outboxId: outboxId(),
      gulfosUserId: batch.gulfosUserId,
      discordUserId: batch.discordUserId,
      dmChannelId: link?.dmChannelId,
      externalCharacterId: batch.externalCharacterId,
      category: 'app_notification',
      priority: highestPriority,
      notificationId: batch.items[0].notificationId,
      queueId: batch.items[0].queueId,
      embedPayload,
      status: 'pending',
      groupedCount: batch.items.length,
    });
  }

  batch.flushed = true;
  await batch.save();
}

export async function writeImmediateDiscordOutbox(input: {
  context: NotificationDeliveryContext;
  decision: DiscordDeliveryDecision;
}): Promise<string> {
  const { context, decision } = input;
  const sanitized = sanitizeNotificationContent({
    title: context.title,
    body: context.body,
    payload: context.payload,
  });

  const embedPayload = buildDiscordEmbed({
    context: { ...context, title: sanitized.title, body: sanitized.body },
    category: decision.category!,
    characterName: decision.characterName ?? 'Character',
    phoneNumber: decision.phoneNumber,
    appName: resolveAppName(context.appId),
    sanitizedTitle: sanitized.title,
    sanitizedBody: sanitized.body,
  });

  const doc = await DiscordNotificationOutbox.create({
    outboxId: outboxId(),
    gulfosUserId: new Types.ObjectId(context.userId),
    discordUserId: decision.discordUserId!,
    dmChannelId: decision.dmChannelId,
    externalCharacterId: decision.externalCharacterId!,
    phoneId: context.phoneId,
    category: decision.category!,
    priority: context.priority,
    notificationId: context.notificationId,
    queueId: context.queueId,
    embedPayload,
    status: 'pending',
  });

  return doc.outboxId;
}
