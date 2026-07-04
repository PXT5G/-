import { Types } from 'mongoose';
import { OfflineMessageQueue } from '../database/models/OfflineMessageQueue';
import { Message } from '../database/models/Message';
import { emitToUser } from './socketService';
import { publishEvent } from './eventBusService';

export async function queueOfflineMessage(userId: string, clientMessageId: string, payload: Record<string, unknown>, actorId: string) {
  const entry = await OfflineMessageQueue.findOneAndUpdate(
    { userId, clientMessageId },
    {
      userId: new Types.ObjectId(userId),
      clientMessageId,
      payload,
      state: 'pending',
      createdBy: new Types.ObjectId(actorId),
    },
    { upsert: true, new: true }
  );
  return { clientMessageId: entry.clientMessageId, state: entry.state };
}

export async function syncOfflineQueue(userId: string): Promise<number> {
  const pending = await OfflineMessageQueue.find({ userId, state: { $in: ['pending', 'retry', 'conflict'] }, deletedAt: null }).limit(50);
  const { sendMessage } = await import('./communicationService');
  let synced = 0;

  for (const entry of pending) {
    try {
      entry.state = 'syncing';
      await entry.save();

      const payload = entry.payload as {
        conversationId: string;
        body: string;
        messageType?: string;
        contentType?: string;
        appId: string;
        clientMessageId?: string;
      };

      await sendMessage({
        userId,
        appId: payload.appId,
        conversationId: payload.conversationId,
        body: payload.body,
        messageType: (payload.messageType ?? 'private_chat') as never,
        contentType: (payload.contentType ?? 'text') as never,
        clientMessageId: entry.clientMessageId,
        actorId: userId,
      });

      entry.state = 'synced';
      entry.lastSyncAt = new Date();
      await entry.save();
      synced++;
    } catch (err) {
      entry.state = entry.retryCount >= 3 ? 'failed' : 'pending';
      entry.retryCount++;
      await entry.save();
    }
  }

  if (synced > 0) {
    emitToUser(userId, 'sync:complete', { synced, timestamp: new Date().toISOString() });
    await publishEvent({ userId, namespace: 'communication.sync', event: 'sync:complete', payload: { synced }, source: 'syncService' });
  }
  return synced;
}

export async function resolveConflict(
  userId: string,
  clientMessageId: string,
  resolution: 'client_wins' | 'server_wins' | 'merged',
  mergedPayload?: Record<string, unknown>
) {
  const entry = await OfflineMessageQueue.findOne({ userId, clientMessageId });
  if (!entry) throw new Error('QUEUE_ENTRY_NOT_FOUND');

  if (resolution === 'server_wins') {
    entry.state = 'synced';
    entry.conflictResolution = 'server_wins';
    await entry.save();
    return { resolved: true, resolution };
  }

  if (resolution === 'client_wins' || resolution === 'merged') {
    if (mergedPayload) entry.payload = mergedPayload;
    entry.state = 'pending';
    entry.conflictResolution = resolution;
    await entry.save();
    await syncOfflineQueue(userId);
    return { resolved: true, resolution };
  }

  return { resolved: false };
}

export async function getSyncStatus(userId: string) {
  const [pending, failed, synced] = await Promise.all([
    OfflineMessageQueue.countDocuments({ userId, state: 'pending', deletedAt: null }),
    OfflineMessageQueue.countDocuments({ userId, state: 'failed', deletedAt: null }),
    OfflineMessageQueue.countDocuments({ userId, state: 'synced', deletedAt: null }),
  ]);
  const lastMessage = await Message.findOne({ senderId: userId }).sort({ sentAt: -1 });
  return {
    pending,
    failed,
    synced,
    lastMessageAt: lastMessage?.sentAt?.toISOString(),
  };
}

export async function expireAutoDeleteMessages(): Promise<number> {
  const now = new Date();
  const expired = await Message.find({ autoDeleteAt: { $lte: now }, deletedAt: null, deletedForEveryone: false });
  for (const msg of expired) {
    msg.deletedForEveryone = true;
    msg.body = '';
    msg.encryptedBody = undefined;
    await msg.save();
  }
  return expired.length;
}

export async function processScheduledMessages(): Promise<number> {
  const now = new Date();
  const scheduled = await Message.find({
    scheduledAt: { $lte: now },
    sentAt: null,
    deletedAt: null,
    deliveryState: 'queued',
  }).limit(50);

  const { deliverScheduledMessage } = await import('./communicationService');
  let sent = 0;
  for (const msg of scheduled) {
    await deliverScheduledMessage(msg.messageId);
    sent++;
  }
  return sent;
}
