import { Types } from 'mongoose';
import { TypingStatus } from '../database/models/TypingStatus';
import { TYPING_EXPIRY_MS } from '../constants/communication';
import { ConversationMember } from '../database/models/ConversationMember';
import { emitToUser } from './socketService';
import { setPresence } from './presenceService';

export async function startTyping(
  userId: string,
  conversationId: string,
  options?: { recording?: boolean; actorId?: string }
) {
  const member = await ConversationMember.findOne({ conversationId, userId, deletedAt: null, leftAt: null });
  if (!member) throw new Error('NOT_A_MEMBER');

  const expiresAt = new Date(Date.now() + TYPING_EXPIRY_MS);
  await TypingStatus.findOneAndUpdate(
    { conversationId, userId },
    {
      conversationId,
      userId: new Types.ObjectId(userId),
      isTyping: !options?.recording,
      isRecording: !!options?.recording,
      expiresAt,
      updatedBy: options?.actorId ? new Types.ObjectId(options.actorId) : undefined,
    },
    { upsert: true, new: true }
  );

  await setPresence(userId, options?.recording ? 'recording_voice' : 'typing', { conversationId, actorId: options?.actorId });

  const members = await ConversationMember.find({ conversationId, deletedAt: null, leftAt: null });
  const payload = { conversationId, userId, isTyping: !options?.recording, isRecording: !!options?.recording };
  for (const m of members) {
    if (m.userId.toString() !== userId) {
      emitToUser(m.userId.toString(), 'typing:update', payload);
    }
  }
  return payload;
}

export async function stopTyping(userId: string, conversationId: string, actorId?: string) {
  await TypingStatus.deleteOne({ conversationId, userId });
  await setPresence(userId, 'online', { conversationId, actorId });

  const members = await ConversationMember.find({ conversationId, deletedAt: null, leftAt: null });
  const payload = { conversationId, userId, isTyping: false, isRecording: false };
  for (const m of members) {
    if (m.userId.toString() !== userId) {
      emitToUser(m.userId.toString(), 'typing:update', payload);
    }
  }
  return payload;
}

export async function getTypingUsers(conversationId: string) {
  const now = new Date();
  const typing = await TypingStatus.find({ conversationId, expiresAt: { $gt: now }, deletedAt: null });
  return typing.map((t) => ({
    userId: t.userId.toString(),
    isTyping: t.isTyping,
    isRecording: t.isRecording,
  }));
}

export async function expireTypingStatuses(): Promise<number> {
  const now = new Date();
  const expired = await TypingStatus.find({ expiresAt: { $lte: now } });
  for (const t of expired) {
    await TypingStatus.deleteOne({ _id: t._id });
    await setPresence(t.userId.toString(), 'online', { conversationId: t.conversationId });
  }
  return expired.length;
}
