import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { Conversation } from '../database/models/Conversation';
import { ConversationMember } from '../database/models/ConversationMember';
import { ConversationRole } from '../database/models/ConversationRole';
import { PinnedMessage } from '../database/models/PinnedMessage';
import { User } from '../database/models/User';
import type { ConversationType, ConversationRoleType } from '../constants/communication';
import { ensureConversationKey } from './encryptionService';
import { logCommunicationAudit } from './communicationAuditService';
import { emitToUser } from './socketService';

const DEFAULT_ROLE_PERMISSIONS: Record<ConversationRoleType, Partial<InstanceType<typeof ConversationRole>>> = {
  owner: { canSendMessages: true, canSendMedia: true, canPinMessages: true, canDeleteMessages: true, canManageMembers: true, canManageRoles: true },
  admin: { canSendMessages: true, canSendMedia: true, canPinMessages: true, canDeleteMessages: true, canManageMembers: true, canManageRoles: false },
  moderator: { canSendMessages: true, canSendMedia: true, canPinMessages: true, canDeleteMessages: true, canManageMembers: false, canManageRoles: false },
  member: { canSendMessages: true, canSendMedia: true, canPinMessages: false, canDeleteMessages: false, canManageMembers: false, canManageRoles: false },
  viewer: { canSendMessages: false, canSendMedia: false, canPinMessages: false, canDeleteMessages: false, canManageMembers: false, canManageRoles: false },
};

function formatConversation(c: InstanceType<typeof Conversation>, unreadCount = 0) {
  return {
    conversationId: c.conversationId,
    type: c.type,
    title: c.title,
    description: c.description,
    avatarUrl: c.avatarUrl,
    isEncrypted: c.isEncrypted,
    announcementOnly: c.announcementOnly,
    lastMessageAt: c.lastMessageAt?.toISOString(),
    lastMessagePreview: c.lastMessagePreview,
    memberCount: c.memberCount,
    unreadCount,
    pinnedMessageIds: c.pinnedMessageIds,
  };
}

export async function createConversation(params: {
  type: ConversationType;
  title?: string;
  memberIds: string[];
  creatorId: string;
  appId: string;
  description?: string;
  announcementOnly?: boolean;
}) {
  const conversationId = uuidv4();
  const allMembers = Array.from(new Set([params.creatorId, ...params.memberIds]));

  const conversation = await Conversation.create({
    conversationId,
    type: params.type,
    title: params.title ?? (params.type === 'private' ? 'Private Chat' : 'Group Chat'),
    description: params.description,
    isEncrypted: true,
    announcementOnly: params.announcementOnly ?? false,
    memberCount: allMembers.length,
    createdBy: new Types.ObjectId(params.creatorId),
  });

  for (const roleName of Object.keys(DEFAULT_ROLE_PERMISSIONS) as ConversationRoleType[]) {
    await ConversationRole.create({
      conversationId,
      roleName,
      permissions: [],
      ...DEFAULT_ROLE_PERMISSIONS[roleName],
    });
  }

  for (const memberId of allMembers) {
    await ConversationMember.create({
      conversationId,
      userId: new Types.ObjectId(memberId),
      role: memberId === params.creatorId ? 'owner' : 'member',
      joinedAt: new Date(),
      createdBy: new Types.ObjectId(params.creatorId),
    });
    emitToUser(memberId, 'conversation:new', formatConversation(conversation));
  }

  await ensureConversationKey(conversationId, params.creatorId);
  await logCommunicationAudit({
    userId: params.creatorId,
    actorId: params.creatorId,
    appId: params.appId,
    action: 'conversation_create',
    resource: 'conversation',
    resourceId: conversationId,
    conversationId,
    metadata: { type: params.type, memberCount: allMembers.length },
  });

  return formatConversation(conversation);
}

export async function getOrCreatePrivateConversation(userId: string, otherUserId: string, appId: string) {
  const myMemberships = await ConversationMember.find({ userId, deletedAt: null, leftAt: null });
  for (const m of myMemberships) {
    const conv = await Conversation.findOne({ conversationId: m.conversationId, type: 'private', deletedAt: null });
    if (!conv) continue;
    const other = await ConversationMember.findOne({
      conversationId: m.conversationId,
      userId: otherUserId,
      deletedAt: null,
      leftAt: null,
    });
    if (other) return formatConversation(conv);
  }
  const otherUser = await User.findById(otherUserId);
  return createConversation({
    type: 'private',
    title: otherUser?.displayName ?? otherUser?.username ?? 'Chat',
    memberIds: [otherUserId],
    creatorId: userId,
    appId,
  });
}

export async function getUserConversations(userId: string, limit = 50, offset = 0) {
  const memberships = await ConversationMember.find({ userId, deletedAt: null, leftAt: null })
    .sort({ pinned: -1, updatedAt: -1 })
    .skip(offset)
    .limit(limit);

  const results = [];
  for (const m of memberships) {
    const conv = await Conversation.findOne({ conversationId: m.conversationId, deletedAt: null });
    if (!conv) continue;
    const { getUnreadCount } = await import('./readReceiptService');
    const unread = await getUnreadCount(userId, m.conversationId);
    results.push({ ...formatConversation(conv, unread), role: m.role, pinned: m.pinned, muted: m.muted });
  }
  return results;
}

export async function getConversation(conversationId: string, userId: string) {
  const member = await ConversationMember.findOne({ conversationId, userId, deletedAt: null, leftAt: null });
  if (!member) throw new Error('NOT_A_MEMBER');
  const conv = await Conversation.findOne({ conversationId, deletedAt: null });
  if (!conv) throw new Error('CONVERSATION_NOT_FOUND');
  const { getUnreadCount } = await import('./readReceiptService');
  const unread = await getUnreadCount(userId, conversationId);
  return { ...formatConversation(conv, unread), role: member.role };
}

export async function getConversationMembers(conversationId: string) {
  const members = await ConversationMember.find({ conversationId, deletedAt: null, leftAt: null });
  const users = await User.find({ _id: { $in: members.map((m) => m.userId) } });
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  return members.map((m) => {
    const u = userMap.get(m.userId.toString());
    return {
      userId: m.userId.toString(),
      username: u?.username,
      displayName: u?.displayName,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    };
  });
}

export async function addMember(conversationId: string, userId: string, newMemberId: string, appId: string, actorId: string) {
  const actor = await ConversationMember.findOne({ conversationId, userId, deletedAt: null, leftAt: null });
  if (!actor || !['owner', 'admin'].includes(actor.role)) throw new Error('PERMISSION_DENIED');

  await ConversationMember.findOneAndUpdate(
    { conversationId, userId: newMemberId },
    {
      conversationId,
      userId: new Types.ObjectId(newMemberId),
      role: 'member',
      joinedAt: new Date(),
      leftAt: null,
      deletedAt: null,
      createdBy: new Types.ObjectId(actorId),
    },
    { upsert: true }
  );

  await Conversation.findOneAndUpdate({ conversationId }, { $inc: { memberCount: 1 } });
  emitToUser(newMemberId, 'conversation:member_added', { conversationId, userId: newMemberId });
  await logCommunicationAudit({ userId, actorId, appId, action: 'member_add', resource: 'conversation', conversationId, metadata: { newMemberId } });
}

export async function pinMessage(conversationId: string, messageId: string, userId: string, appId: string, actorId: string) {
  const member = await ConversationMember.findOne({ conversationId, userId, deletedAt: null });
  if (!member) throw new Error('NOT_A_MEMBER');

  await PinnedMessage.findOneAndUpdate(
    { conversationId, messageId },
    { conversationId, messageId, pinnedBy: new Types.ObjectId(actorId), pinnedAt: new Date(), deletedAt: null },
    { upsert: true }
  );
  await Conversation.findOneAndUpdate({ conversationId }, { $addToSet: { pinnedMessageIds: messageId } });
  await logCommunicationAudit({ userId, actorId, appId, action: 'message_pin', resource: 'message', conversationId, messageId });
  return { conversationId, messageId, pinned: true };
}
