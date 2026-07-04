import { Types } from 'mongoose';
import { Reaction } from '../database/models/Reaction';
import { ConversationMember } from '../database/models/ConversationMember';
import { Message } from '../database/models/Message';
import { emitToUser } from './socketService';
import { logCommunicationAudit } from './communicationAuditService';

export async function addReaction(
  userId: string,
  messageId: string,
  conversationId: string,
  emoji: string,
  appId: string,
  actorId: string
) {
  const member = await ConversationMember.findOne({ conversationId, userId, deletedAt: null, leftAt: null });
  if (!member) throw new Error('NOT_A_MEMBER');

  const message = await Message.findOne({ messageId, conversationId, deletedAt: null });
  if (!message) throw new Error('MESSAGE_NOT_FOUND');

  await Reaction.findOneAndUpdate(
    { messageId, userId, emoji },
    {
      messageId,
      conversationId,
      userId: new Types.ObjectId(userId),
      emoji,
      deletedAt: null,
      createdBy: new Types.ObjectId(actorId),
    },
    { upsert: true, new: true }
  );

  await logCommunicationAudit({ userId, actorId, appId, action: 'reaction_add', resource: 'reaction', messageId, conversationId, metadata: { emoji } });

  const reactions = await getMessageReactions(messageId);
  const payload = { messageId, conversationId, reactions };
  const members = await ConversationMember.find({ conversationId, deletedAt: null, leftAt: null });
  for (const m of members) {
    emitToUser(m.userId.toString(), 'reaction:update', payload);
  }
  return payload;
}

export async function removeReaction(
  userId: string,
  messageId: string,
  emoji: string,
  appId: string,
  actorId: string
) {
  await Reaction.findOneAndUpdate(
    { messageId, userId, emoji },
    { deletedAt: new Date(), updatedBy: new Types.ObjectId(actorId) }
  );
  const message = await Message.findOne({ messageId, deletedAt: null });
  if (!message) return { messageId, reactions: [] };
  const reactions = await getMessageReactions(messageId);
  const payload = { messageId, conversationId: message.conversationId, reactions };
  const members = await ConversationMember.find({ conversationId: message.conversationId, deletedAt: null, leftAt: null });
  for (const m of members) {
    emitToUser(m.userId.toString(), 'reaction:update', payload);
  }
  return payload;
}

export async function getMessageReactions(messageId: string) {
  const reactions = await Reaction.find({ messageId, deletedAt: null });
  const grouped = new Map<string, { emoji: string; count: number; userIds: string[] }>();
  for (const r of reactions) {
    const existing = grouped.get(r.emoji) ?? { emoji: r.emoji, count: 0, userIds: [] };
    existing.count++;
    existing.userIds.push(r.userId.toString());
    grouped.set(r.emoji, existing);
  }
  return Array.from(grouped.values());
}
