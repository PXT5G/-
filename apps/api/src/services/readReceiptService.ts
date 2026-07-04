import { Types } from 'mongoose';
import { ReadReceipt } from '../database/models/ReadReceipt';
import { DeliveryStatus } from '../database/models/DeliveryStatus';
import { ConversationMember } from '../database/models/ConversationMember';
import { Message } from '../database/models/Message';
import { emitToUser } from './socketService';
import { updateDeliveryState } from './deliveryService';

export async function markMessageRead(
  userId: string,
  messageId: string,
  conversationId: string,
  actorId: string
) {
  const member = await ConversationMember.findOne({ conversationId, userId, deletedAt: null, leftAt: null });
  if (!member) throw new Error('NOT_A_MEMBER');

  const message = await Message.findOne({ messageId, conversationId, deletedAt: null });
  if (!message) throw new Error('MESSAGE_NOT_FOUND');

  await ReadReceipt.findOneAndUpdate(
    { messageId, userId },
    {
      messageId,
      conversationId,
      userId: new Types.ObjectId(userId),
      readAt: new Date(),
      createdBy: new Types.ObjectId(actorId),
    },
    { upsert: true }
  );

  member.lastReadMessageId = messageId;
  member.lastReadAt = new Date();
  await member.save();

  await updateDeliveryState(messageId, userId, 'read', actorId);

  const payload = { messageId, conversationId, userId, readAt: new Date().toISOString() };
  emitToUser(message.senderId.toString(), 'message:read', payload);

  const members = await ConversationMember.find({ conversationId, deletedAt: null, leftAt: null });
  for (const m of members) {
    if (m.userId.toString() !== userId) {
      emitToUser(m.userId.toString(), 'message:read', payload);
    }
  }
  return payload;
}

export async function markConversationRead(userId: string, conversationId: string, actorId: string) {
  const lastMessage = await Message.findOne({ conversationId, deletedAt: null, deletedForEveryone: false })
    .sort({ sentAt: -1 });
  if (!lastMessage) return { conversationId, read: true };
  return markMessageRead(userId, lastMessage.messageId, conversationId, actorId);
}

export async function getReadReceipts(messageId: string) {
  const receipts = await ReadReceipt.find({ messageId, deletedAt: null });
  return receipts.map((r) => ({
    userId: r.userId.toString(),
    readAt: r.readAt.toISOString(),
  }));
}

export async function getUnreadCount(userId: string, conversationId: string): Promise<number> {
  const member = await ConversationMember.findOne({ conversationId, userId, deletedAt: null });
  if (!member?.lastReadAt) {
    return Message.countDocuments({ conversationId, deletedAt: null, deletedForEveryone: false, senderId: { $ne: userId } });
  }
  return Message.countDocuments({
    conversationId,
    deletedAt: null,
    deletedForEveryone: false,
    senderId: { $ne: userId },
    sentAt: { $gt: member.lastReadAt },
  });
}
