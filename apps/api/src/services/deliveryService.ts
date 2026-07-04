import { Types } from 'mongoose';
import { DeliveryStatus } from '../database/models/DeliveryStatus';
import type { DeliveryState } from '../constants/communication';
import { ConversationMember } from '../database/models/ConversationMember';
import { Message } from '../database/models/Message';
import { emitToUser } from './socketService';
import { getNetwork } from './networkService';

const MAX_DELIVERY_ATTEMPTS = 5;

export async function createDeliveryStatuses(messageId: string, conversationId: string, senderId: string) {
  const members = await ConversationMember.find({
    conversationId,
    deletedAt: null,
    leftAt: null,
    userId: { $ne: senderId },
  });

  const statuses = [];
  for (const m of members) {
    const status = await DeliveryStatus.create({
      messageId,
      conversationId,
      recipientId: m.userId,
      state: 'queued',
    });
    statuses.push(status);
  }
  return statuses;
}

export async function processDeliveryQueue(): Promise<number> {
  const pending = await DeliveryStatus.find({
    state: { $in: ['queued', 'retry', 'encrypting', 'sending'] },
    deletedAt: null,
  }).limit(100);

  let processed = 0;
  for (const status of pending) {
    try {
      const net = await getNetwork(status.recipientId.toString());
      if (!net.internetConnected) {
        status.state = 'retry';
        status.attempts++;
        status.lastAttemptAt = new Date();
        status.failureReason = 'NO_NETWORK';
        await status.save();
        continue;
      }

      status.state = 'encrypting';
      await status.save();
      status.state = 'sending';
      status.attempts++;
      status.lastAttemptAt = new Date();
      await status.save();

      status.state = 'delivered';
      status.deliveredAt = new Date();
      await status.save();

      const message = await Message.findOne({ messageId: status.messageId });
      if (message) {
        emitToUser(status.recipientId.toString(), 'message:delivered', {
          messageId: status.messageId,
          conversationId: status.conversationId,
          deliveredAt: status.deliveredAt.toISOString(),
        });
        emitToUser(message.senderId.toString(), 'message:delivered', {
          messageId: status.messageId,
          conversationId: status.conversationId,
          recipientId: status.recipientId.toString(),
          deliveredAt: status.deliveredAt.toISOString(),
        });
      }
      processed++;
    } catch {
      status.state = status.attempts >= MAX_DELIVERY_ATTEMPTS ? 'failed' : 'retry';
      status.failureReason = 'DELIVERY_ERROR';
      await status.save();
    }
  }
  return processed;
}

export async function updateDeliveryState(
  messageId: string,
  recipientId: string,
  state: DeliveryState,
  actorId?: string
) {
  const status = await DeliveryStatus.findOneAndUpdate(
    { messageId, recipientId },
    {
      state,
      ...(state === 'delivered' ? { deliveredAt: new Date() } : {}),
      ...(state === 'read' ? { readAt: new Date(), state: 'read' } : {}),
      ...(actorId ? { updatedBy: new Types.ObjectId(actorId) } : {}),
    },
    { new: true }
  );
  return status;
}

export async function getDeliveryStatus(messageId: string) {
  const statuses = await DeliveryStatus.find({ messageId, deletedAt: null });
  return statuses.map((s) => ({
    recipientId: s.recipientId.toString(),
    state: s.state,
    deliveredAt: s.deliveredAt?.toISOString(),
    readAt: s.readAt?.toISOString(),
    attempts: s.attempts,
  }));
}

export async function cancelDelivery(messageId: string, actorId: string) {
  await DeliveryStatus.updateMany(
    { messageId, state: { $in: ['queued', 'retry'] } },
    { state: 'cancelled', updatedBy: new Types.ObjectId(actorId) }
  );
}
