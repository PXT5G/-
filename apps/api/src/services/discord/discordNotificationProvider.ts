import { DiscordNotificationOutbox } from '../../database/models/DiscordNotificationOutbox';
import { DISCORD_PROVIDER_ID } from '../../constants/discordNotifications';
import type { NotificationProvider, NotificationDeliveryContext } from '../../constants/notificationProviders';
import { evaluateDiscordDelivery } from './discordDeliveryService';
import { enqueueForDiscordGrouping } from './discordGroupingService';
import { env } from '../../config/env';

export const discordNotificationProvider: NotificationProvider = {
  id: DISCORD_PROVIDER_ID,
  channel: 'discord',
  isEnabled: () => env.DISCORD_NOTIFICATIONS_ENABLED,
  async deliver(context: NotificationDeliveryContext): Promise<void> {
    const decision = await evaluateDiscordDelivery(context);
    if (!decision.deliver) {
      // V1: never queue for later — GULFOS in-app delivery already handled by socket provider
      return;
    }

    if (context.priority === 'critical') {
      const { writeImmediateDiscordOutbox } = await import('./discordGroupingService');
      await writeImmediateDiscordOutbox({ context, decision });
      return;
    }

    await enqueueForDiscordGrouping({ context, decision });
  },
};

export async function listPendingDiscordNotifications(limit = 50) {
  const { getActiveVerifiedSession } = await import('./discordVerifiedSessionService');
  const items = await DiscordNotificationOutbox.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .limit(limit * 2);

  const deliverable = [];
  for (const doc of items) {
    const session = await getActiveVerifiedSession(doc.gulfosUserId.toString());
    if (!session) continue;
    if (session.externalCharacterId !== doc.externalCharacterId) continue;
    if (!session.notificationsEnabled || !session.gameConnected) continue;
    deliverable.push(doc);
    if (deliverable.length >= limit) break;
  }

  return deliverable.map((doc) => ({
    outboxId: doc.outboxId,
    discordUserId: doc.discordUserId,
    dmChannelId: doc.dmChannelId,
    externalCharacterId: doc.externalCharacterId,
    category: doc.category,
    priority: doc.priority,
    embedPayload: doc.embedPayload,
    groupedCount: doc.groupedCount,
    createdAt: doc.createdAt.toISOString(),
  }));
}

export async function acknowledgeDiscordNotification(
  outboxId: string,
  success: boolean,
  failureReason?: string
) {
  const doc = await DiscordNotificationOutbox.findOne({ outboxId });
  if (!doc) return null;

  doc.status = success ? 'delivered' : 'failed';
  doc.deliveredAt = success ? new Date() : undefined;
  doc.failureReason = failureReason;
  await doc.save();

  return { outboxId: doc.outboxId, status: doc.status };
}
