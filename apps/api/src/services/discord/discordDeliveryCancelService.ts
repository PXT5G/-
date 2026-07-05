import { Types } from 'mongoose';
import { DiscordNotificationOutbox } from '../../database/models/DiscordNotificationOutbox';
import { DiscordNotificationBatch } from '../../database/models/DiscordNotificationBatch';

/**
 * V1 rule: failed Discord delivery is never queued for later.
 * Cancel all pending Discord outbox + grouping batches immediately.
 */
export async function cancelPendingDiscordDeliveries(
  gulfosUserId: string,
  reason: string,
  externalCharacterId?: string
): Promise<{ cancelledOutbox: number; cancelledBatches: number }> {
  const outboxFilter: Record<string, unknown> = {
    gulfosUserId: new Types.ObjectId(gulfosUserId),
    status: { $in: ['pending', 'grouped'] },
  };
  if (externalCharacterId) outboxFilter.externalCharacterId = externalCharacterId;

  const outboxResult = await DiscordNotificationOutbox.updateMany(outboxFilter, {
    $set: { status: 'cancelled', failureReason: reason },
  });

  const batchFilter: Record<string, unknown> = {
    gulfosUserId: new Types.ObjectId(gulfosUserId),
    flushed: false,
  };
  if (externalCharacterId) batchFilter.externalCharacterId = externalCharacterId;

  const batchResult = await DiscordNotificationBatch.updateMany(batchFilter, {
    $set: { flushed: true },
  });

  return {
    cancelledOutbox: outboxResult.modifiedCount,
    cancelledBatches: batchResult.modifiedCount,
  };
}
