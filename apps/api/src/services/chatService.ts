import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { User } from '../database/models/User';
import { ConversationMember } from '../database/models/ConversationMember';
import { ChatProfile } from '../database/models/ChatProfile';
import { ChatConversationMeta } from '../database/models/ChatConversationMeta';
import { ChatMessageRequest } from '../database/models/ChatMessageRequest';
import { ChatBroadcastList } from '../database/models/ChatBroadcastList';
import { ChatChannel } from '../database/models/ChatChannel';
import { ChatCommunity } from '../database/models/ChatCommunity';
import { ChatPoll } from '../database/models/ChatPoll';
import { ChatBlockedUser } from '../database/models/ChatBlockedUser';
import { ChatCall } from '../database/models/ChatCall';
import { ChatCallParticipant } from '../database/models/ChatCallParticipant';
import { ChatInviteLink } from '../database/models/ChatInviteLink';
import { ChatJoinRequest } from '../database/models/ChatJoinRequest';
import { ChatPrivacySettings } from '../database/models/ChatPrivacySettings';
import { ChatTrustedDevice } from '../database/models/ChatTrustedDevice';
import { ChatSticker } from '../database/models/ChatSticker';
import {
  CHAT_APP_BUNDLE,
  CHAT_SOCKET_EVENTS,
  CHAT_STICKER_PACKS,
  CHAT_EMOJI_CATEGORIES,
  type ChatConversationKind,
  type ChatCallType,
} from '../constants/chat';
import {
  seedChatRoleConfigs,
  getRolePermissions,
  assertChatPermission,
  formatChatProfile,
  getChatProfile,
  updateRolePermissions,
} from './chatRBACService';
import {
  generateInviteCode,
  getIntegrationStatus,
  logChatAction,
  sendChatNotification,
  buildContactCard,
  buildIdentityCard,
  buildBankTransferCard,
  buildLocationShare,
  buildQrMessage,
  mapChatRoleToConversationRole,
} from './chatIntegrationService';
import { checkPermission } from './permissionBrokerService';
import { emitToUser } from './socketService';
import { initializeCommunication, sendMessage, getMessages, editMessage, deleteMessageForMe, deleteMessageForEveryone, forwardMessage, searchCommunication } from './communicationService';
import { getUserConversations, createConversation, getOrCreatePrivateConversation, getConversation, getConversationMembers, addMember, pinMessage } from './conversationService';
import { addReaction, removeReaction } from './reactionService';
import { startTyping, stopTyping } from './typingService';
import { setPresence, getPresence } from './presenceService';

function id(prefix: string) {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function emitChat(userId: string, event: string, data: unknown) {
  emitToUser(userId, event as never, { ...(data as object), timestamp: new Date().toISOString() });
}

async function ensureMeta(userId: string, conversationId: string, kind: ChatConversationKind = 'private') {
  let meta = await ChatConversationMeta.findOne({ userId, conversationId });
  if (!meta) {
    meta = await ChatConversationMeta.create({
      metaId: id('META'),
      userId: new Types.ObjectId(userId),
      conversationId,
      kind,
    });
  }
  return meta;
}

async function isBlocked(userId: string, otherUserId: string): Promise<boolean> {
  const block = await ChatBlockedUser.findOne({
    $or: [
      { userId, blockedUserId: otherUserId },
      { userId: otherUserId, blockedUserId: userId },
    ],
  });
  return Boolean(block);
}

export async function seedStickers(): Promise<void> {
  const stickers = [
    { packId: 'gulf-default', emoji: '👋', label: 'Wave', sortOrder: 1 },
    { packId: 'gulf-default', emoji: '❤️', label: 'Love', sortOrder: 2 },
    { packId: 'gulf-default', emoji: '😂', label: 'Laugh', sortOrder: 3 },
    { packId: 'gulf-default', emoji: '🔥', label: 'Fire', sortOrder: 4 },
    { packId: 'gulf-default', emoji: '✨', label: 'Sparkle', sortOrder: 5 },
    { packId: 'gulf-default', emoji: '👍', label: 'Thumbs Up', sortOrder: 6 },
    { packId: 'gulf-police', emoji: '🚔', label: 'Police', sortOrder: 1 },
    { packId: 'gulf-police', emoji: '🛡️', label: 'Shield', sortOrder: 2 },
    { packId: 'gulf-celebrate', emoji: '🎉', label: 'Party', sortOrder: 1 },
    { packId: 'gulf-celebrate', emoji: '🏆', label: 'Trophy', sortOrder: 2 },
  ];
  for (const s of stickers) {
    const stickerId = `${s.packId}-${s.emoji}`;
    await ChatSticker.findOneAndUpdate(
      { stickerId },
      { stickerId, packId: s.packId, emoji: s.emoji, label: s.label, sortOrder: s.sortOrder },
      { upsert: true }
    );
  }
}

export async function initializeChat(userId: string, userRole?: string, deviceUuid?: string) {
  await seedChatRoleConfigs();
  await seedStickers();

  const hasApp = await checkPermission(userId, CHAT_APP_BUNDLE, 'network');
  if (!hasApp && userRole !== 'admin') throw new Error('APP_NOT_INSTALLED');

  await initializeCommunication(userId);

  let profile = await ChatProfile.findOne({ userId, deletedAt: null });
  if (!profile) {
    const user = await User.findById(userId);
    if (!user) throw new Error('USER_NOT_FOUND');
    profile = await ChatProfile.create({
      userId: new Types.ObjectId(userId),
      role: 'user',
      displayName: user.displayName || user.username,
      initialized: true,
      createdBy: new Types.ObjectId(userId),
    });
  } else if (!profile.initialized) {
    profile.initialized = true;
    await profile.save();
  }

  let privacy = await ChatPrivacySettings.findOne({ userId });
  if (!privacy) {
    privacy = await ChatPrivacySettings.create({ userId: new Types.ObjectId(userId) });
  }

  if (deviceUuid) {
    await ChatTrustedDevice.findOneAndUpdate(
      { userId, deviceUuid },
      {
        deviceId: id('DEV'),
        userId: new Types.ObjectId(userId),
        deviceUuid,
        name: 'Gulf Phone',
        verified: true,
        verifiedAt: new Date(),
        lastActiveAt: new Date(),
      },
      { upsert: true }
    );
  }

  const permissions = await getRolePermissions(profile.role);
  const integrations = await getIntegrationStatus(userId);
  const payload = {
    profile: formatChatProfile(profile),
    permissions,
    integrations,
    privacy: privacy.toObject(),
    stickerPacks: CHAT_STICKER_PACKS,
    emojiCategories: CHAT_EMOJI_CATEGORIES,
    socketEvents: CHAT_SOCKET_EVENTS,
  };

  emitChat(userId, 'chat:initialized', payload);
  return payload;
}

export async function getInbox(userId: string, userRole: string | undefined, filter?: { archived?: boolean; unreadOnly?: boolean; favorites?: boolean }) {
  await assertChatPermission(userId, 'chat.access', userRole);
  const conversations = await getUserConversations(userId, 100, 0);
  const metas = await ChatConversationMeta.find({ userId });
  const metaMap = new Map(metas.map((m) => [m.conversationId, m]));

  let results = conversations.map((c) => {
    const meta = metaMap.get(c.conversationId);
    return {
      ...c,
      kind: meta?.kind ?? (c.type === 'private' ? 'private' : 'group'),
      archived: meta?.archived ?? false,
      favorite: meta?.favorite ?? false,
      hidden: meta?.hidden ?? false,
      locked: meta?.locked ?? false,
      priority: meta?.priority ?? false,
      draft: meta?.draft,
    };
  });

  if (filter?.archived !== undefined) results = results.filter((r) => r.archived === filter.archived);
  else results = results.filter((r) => !r.archived && !r.hidden);
  if (filter?.unreadOnly) results = results.filter((r) => (r.unreadCount ?? 0) > 0);
  if (filter?.favorites) results = results.filter((r) => r.favorite);

  results.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority ? -1 : 1;
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });

  return results;
}

export async function createPrivateChat(userId: string, userRole: string | undefined, otherUserId: string) {
  await assertChatPermission(userId, 'chats.private', userRole);
  if (await isBlocked(userId, otherUserId)) throw new Error('USER_BLOCKED');

  const conv = await getOrCreatePrivateConversation(userId, otherUserId, CHAT_APP_BUNDLE);
  await ensureMeta(userId, conv.conversationId, 'private');
  return conv;
}

export async function createGroupChat(
  userId: string,
  userRole: string | undefined,
  input: { title: string; memberIds: string[]; description?: string }
) {
  await assertChatPermission(userId, 'chats.group', userRole);
  const conv = await createConversation({
    type: 'group',
    title: input.title,
    description: input.description,
    memberIds: input.memberIds,
    creatorId: userId,
    appId: CHAT_APP_BUNDLE,
  });
  await ensureMeta(userId, conv.conversationId, 'group');
  for (const mid of input.memberIds) await ensureMeta(mid, conv.conversationId, 'group');
  return conv;
}

export async function createChannel(
  userId: string,
  userRole: string | undefined,
  input: { title: string; description?: string; isPublic?: boolean }
) {
  await assertChatPermission(userId, 'chats.channel', userRole);
  const conv = await createConversation({
    type: 'group',
    title: input.title,
    description: input.description,
    memberIds: [],
    creatorId: userId,
    appId: CHAT_APP_BUNDLE,
    announcementOnly: true,
  });
  const channel = await ChatChannel.create({
    channelId: id('CH'),
    conversationId: conv.conversationId,
    isPublic: input.isPublic ?? true,
    description: input.description ?? '',
    inviteCode: generateInviteCode(),
  });
  await ensureMeta(userId, conv.conversationId, 'channel');
  return { ...conv, channelId: channel.channelId, inviteCode: channel.inviteCode };
}

export async function createCommunity(
  userId: string,
  userRole: string | undefined,
  input: { name: string; description?: string }
) {
  await assertChatPermission(userId, 'chats.community', userRole);
  const conv = await createConversation({
    type: 'organization',
    title: input.name,
    description: input.description,
    memberIds: [],
    creatorId: userId,
    appId: CHAT_APP_BUNDLE,
  });
  const community = await ChatCommunity.create({
    communityId: id('COM'),
    conversationId: conv.conversationId,
    name: input.name,
    description: input.description ?? '',
    ownerId: new Types.ObjectId(userId),
    channelIds: [],
    groupIds: [],
  });
  await ensureMeta(userId, conv.conversationId, 'community');
  return { ...conv, communityId: community.communityId };
}

export async function createBroadcastList(
  userId: string,
  userRole: string | undefined,
  input: { title: string; memberIds: string[] }
) {
  await assertChatPermission(userId, 'chats.broadcast', userRole);
  const conv = await createConversation({
    type: 'group',
    title: input.title,
    memberIds: input.memberIds,
    creatorId: userId,
    appId: CHAT_APP_BUNDLE,
    announcementOnly: true,
  });
  const list = await ChatBroadcastList.create({
    listId: id('BC'),
    ownerId: new Types.ObjectId(userId),
    title: input.title,
    memberIds: input.memberIds.map((m) => new Types.ObjectId(m)),
    conversationId: conv.conversationId,
  });
  await ensureMeta(userId, conv.conversationId, 'broadcast');
  return { listId: list.listId, conversationId: conv.conversationId, title: list.title };
}

export async function updateConversationMeta(
  userId: string,
  userRole: string | undefined,
  conversationId: string,
  updates: Partial<{ archived: boolean; favorite: boolean; hidden: boolean; locked: boolean; priority: boolean; draft: string }>
) {
  await assertChatPermission(userId, 'chat.access', userRole);
  if (updates.archived !== undefined) await assertChatPermission(userId, 'chats.archive', userRole);
  if (updates.favorite !== undefined) await assertChatPermission(userId, 'chats.favorite', userRole);
  if (updates.locked !== undefined) await assertChatPermission(userId, 'privacy.lock', userRole);

  const meta = await ensureMeta(userId, conversationId);
  if (updates.archived !== undefined) meta.archived = updates.archived;
  if (updates.favorite !== undefined) meta.favorite = updates.favorite;
  if (updates.hidden !== undefined) meta.hidden = updates.hidden;
  if (updates.locked !== undefined) meta.locked = updates.locked;
  if (updates.priority !== undefined) meta.priority = updates.priority;
  if (updates.draft !== undefined) meta.draft = updates.draft;
  await meta.save();

  emitChat(userId, 'chat:conversation:update', { conversationId, ...updates });
  return { conversationId, archived: meta.archived, favorite: meta.favorite, hidden: meta.hidden, locked: meta.locked, priority: meta.priority };
}

export async function pinChat(userId: string, userRole: string | undefined, conversationId: string, pinned: boolean) {
  await assertChatPermission(userId, 'chats.pin', userRole);
  await ConversationMember.findOneAndUpdate({ conversationId, userId }, { pinned });
  return { conversationId, pinned };
}

export async function sendChatMessage(
  userId: string,
  userRole: string | undefined,
  input: {
    conversationId: string;
    body: string;
    contentType?: string;
    messageType?: string;
    replyToMessageId?: string;
    metadata?: Record<string, unknown>;
    scheduledAt?: string;
    autoDeleteAt?: string;
    silent?: boolean;
    clientMessageId?: string;
  }
) {
  await assertChatPermission(userId, 'messages.send', userRole);

  const msg = await sendMessage({
    userId,
    appId: CHAT_APP_BUNDLE,
    conversationId: input.conversationId,
    body: input.body,
    contentType: (input.contentType ?? 'text') as never,
    messageType: (input.messageType ?? 'private_chat') as never,
    replyToMessageId: input.replyToMessageId,
    metadata: input.metadata,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    autoDeleteAt: input.autoDeleteAt ? new Date(input.autoDeleteAt) : undefined,
    silent: input.silent,
    clientMessageId: input.clientMessageId,
    actorId: userId,
  });

  await ChatConversationMeta.findOneAndUpdate(
    { userId, conversationId: input.conversationId },
    { draft: '' }
  );

  return msg;
}

export async function sendRichMessage(
  userId: string,
  userRole: string | undefined,
  input: { conversationId: string; richType: string; data: Record<string, unknown>; replyToMessageId?: string }
) {
  await assertChatPermission(userId, 'media.send', userRole);

  let body = '';
  let contentType = 'text';
  let metadata: Record<string, unknown> = input.data;

  switch (input.richType) {
    case 'contact':
      body = `Contact: ${input.data.displayName}`;
      contentType = 'contact';
      metadata = buildContactCard(String(input.data.userId), String(input.data.displayName), input.data.phone as string);
      break;
    case 'identity_card':
      body = `Identity: ${input.data.displayName}`;
      contentType = 'identity_card';
      metadata = buildIdentityCard(String(input.data.userId), String(input.data.displayName), Boolean(input.data.verified));
      break;
    case 'bank_transfer':
      body = `Transfer: ${input.data.amount} ${input.data.currency}`;
      contentType = 'bank_transfer';
      metadata = buildBankTransferCard(Number(input.data.amount), String(input.data.currency), String(input.data.reference));
      break;
    case 'location':
      body = `Location: ${input.data.label ?? 'Shared location'}`;
      contentType = 'location';
      metadata = buildLocationShare(Number(input.data.latitude), Number(input.data.longitude), input.data.label as string);
      break;
    case 'qr':
      body = `QR: ${input.data.payload}`;
      contentType = 'qr';
      metadata = buildQrMessage(String(input.data.payload));
      break;
    case 'voice_note':
      body = 'Voice message';
      contentType = 'voice_note';
      break;
    case 'poll':
      return createPoll(userId, userRole, {
        conversationId: input.conversationId,
        question: String(input.data.question),
        options: input.data.options as string[],
        multipleChoice: Boolean(input.data.multipleChoice),
      });
    default:
      body = JSON.stringify(input.data);
  }

  return sendChatMessage(userId, userRole, {
    conversationId: input.conversationId,
    body,
    contentType,
    metadata,
    replyToMessageId: input.replyToMessageId,
  });
}

export async function getChatMessages(userId: string, userRole: string | undefined, conversationId: string, before?: string) {
  await assertChatPermission(userId, 'chat.access', userRole);
  return getMessages(userId, conversationId, before ? { before } : undefined);
}

export async function editChatMessage(userId: string, userRole: string | undefined, messageId: string, body: string) {
  await assertChatPermission(userId, 'messages.edit', userRole);
  return editMessage(messageId, userId, body, CHAT_APP_BUNDLE, userId);
}

export async function deleteChatMessage(userId: string, userRole: string | undefined, messageId: string, forEveryone: boolean) {
  await assertChatPermission(userId, 'messages.delete', userRole);
  if (forEveryone) return deleteMessageForEveryone(messageId, userId, CHAT_APP_BUNDLE, userId);
  return deleteMessageForMe(messageId, userId, CHAT_APP_BUNDLE, userId);
}

export async function forwardChatMessage(userId: string, userRole: string | undefined, messageId: string, targetConversationId: string) {
  await assertChatPermission(userId, 'messages.forward', userRole);
  return forwardMessage(messageId, userId, targetConversationId, CHAT_APP_BUNDLE, userId);
}

export async function reactToMessage(userId: string, userRole: string | undefined, messageId: string, conversationId: string, emoji: string) {
  await assertChatPermission(userId, 'messages.reactions', userRole);
  return addReaction(userId, messageId, conversationId, emoji, CHAT_APP_BUNDLE, userId);
}

export async function removeReactionFromMessage(userId: string, userRole: string | undefined, messageId: string, emoji: string) {
  await assertChatPermission(userId, 'messages.reactions', userRole);
  return removeReaction(userId, messageId, emoji, CHAT_APP_BUNDLE, userId);
}

export async function searchChats(userId: string, userRole: string | undefined, query: string, type?: string) {
  await assertChatPermission(userId, 'chats.search', userRole);
  return searchCommunication(userId, query, { type, limit: 30 });
}

export async function listMessageRequests(userId: string, userRole?: string) {
  await assertChatPermission(userId, 'chats.message_requests', userRole);
  const requests = await ChatMessageRequest.find({ toUserId: userId, status: 'pending' }).sort({ createdAt: -1 });
  const users = await User.find({ _id: { $in: requests.map((r) => r.fromUserId) } });
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  return requests.map((r) => ({
    requestId: r.requestId,
    fromUserId: r.fromUserId.toString(),
    fromName: userMap.get(r.fromUserId.toString())?.displayName ?? 'User',
    message: r.message,
    status: r.status,
    createdAt: r.createdAt?.toISOString(),
  }));
}

export async function sendMessageRequest(userId: string, userRole: string | undefined, toUserId: string, message: string) {
  await assertChatPermission(userId, 'chats.message_requests', userRole);
  if (await isBlocked(userId, toUserId)) throw new Error('USER_BLOCKED');

  const request = await ChatMessageRequest.create({
    requestId: id('REQ'),
    fromUserId: new Types.ObjectId(userId),
    toUserId: new Types.ObjectId(toUserId),
    message,
    status: 'pending',
  });

  emitChat(toUserId, 'chat:message:request', { requestId: request.requestId, fromUserId: userId, message });
  sendChatNotification(toUserId, 'Message Request', message);
  return { requestId: request.requestId, status: request.status };
}

export async function respondMessageRequest(
  userId: string,
  userRole: string | undefined,
  requestId: string,
  action: 'accept' | 'decline' | 'block'
) {
  await assertChatPermission(userId, 'chats.message_requests', userRole);
  const request = await ChatMessageRequest.findOne({ requestId, toUserId: userId });
  if (!request) throw new Error('REQUEST_NOT_FOUND');

  if (action === 'block') {
    await ChatBlockedUser.create({
      blockId: id('BLK'),
      userId: new Types.ObjectId(userId),
      blockedUserId: request.fromUserId,
    });
    request.status = 'blocked';
  } else if (action === 'accept') {
    const conv = await getOrCreatePrivateConversation(userId, request.fromUserId.toString(), CHAT_APP_BUNDLE);
    request.status = 'accepted';
    request.conversationId = conv.conversationId;
    await sendMessage({
      userId: request.fromUserId.toString(),
      appId: CHAT_APP_BUNDLE,
      conversationId: conv.conversationId,
      body: request.message,
      actorId: request.fromUserId.toString(),
    });
  } else {
    request.status = 'declined';
  }
  await request.save();
  return { requestId, status: request.status, conversationId: request.conversationId };
}

export async function createPoll(
  userId: string,
  userRole: string | undefined,
  input: { conversationId: string; question: string; options: string[]; multipleChoice?: boolean; anonymous?: boolean }
) {
  await assertChatPermission(userId, 'messages.polls', userRole);
  const options = input.options.map((text, i) => ({ optionId: `opt-${i}`, text, voteCount: 0 }));
  const pollId = id('POLL');

  const msg = await sendMessage({
    userId,
    appId: CHAT_APP_BUNDLE,
    conversationId: input.conversationId,
    body: `Poll: ${input.question}`,
    contentType: 'text',
    messageType: 'group_chat',
    metadata: { pollId, type: 'poll' },
    actorId: userId,
  });

  const poll = await ChatPoll.create({
    pollId,
    messageId: msg.messageId,
    conversationId: input.conversationId,
    creatorId: new Types.ObjectId(userId),
    question: input.question,
    options,
    multipleChoice: input.multipleChoice ?? false,
    anonymous: input.anonymous ?? false,
  });

  emitChat(userId, 'chat:poll:update', { pollId, action: 'created' });
  return { poll: poll.toObject(), message: msg };
}

export async function votePoll(userId: string, userRole: string | undefined, pollId: string, optionId: string) {
  await assertChatPermission(userId, 'messages.polls', userRole);
  const poll = await ChatPoll.findOne({ pollId });
  if (!poll || poll.closed) throw new Error('POLL_NOT_FOUND');

  const existing = poll.votes.find((v) => v.userId.toString() === userId);
  if (existing && !poll.multipleChoice) {
    const oldOpt = poll.options.find((o) => o.optionId === existing.optionId);
    if (oldOpt) oldOpt.voteCount = Math.max(0, oldOpt.voteCount - 1);
    existing.optionId = optionId;
  } else if (!existing) {
    poll.votes.push({ userId: new Types.ObjectId(userId), optionId });
  } else {
    poll.votes.push({ userId: new Types.ObjectId(userId), optionId });
  }

  for (const opt of poll.options) {
    opt.voteCount = poll.votes.filter((v) => v.optionId === opt.optionId).length;
  }
  await poll.save();
  emitChat(userId, 'chat:poll:update', { pollId, action: 'vote' });
  return poll.toObject();
}

export async function getStickers(packId?: string) {
  const filter = packId ? { packId } : {};
  return ChatSticker.find(filter).sort({ sortOrder: 1 });
}

export async function listBlockedUsers(userId: string, userRole?: string) {
  await assertChatPermission(userId, 'privacy.block', userRole);
  const blocks = await ChatBlockedUser.find({ userId });
  const users = await User.find({ _id: { $in: blocks.map((b) => b.blockedUserId) } });
  return users.map((u) => ({ userId: u._id.toString(), displayName: u.displayName, username: u.username }));
}

export async function blockUser(userId: string, userRole: string | undefined, blockedUserId: string, reason?: string) {
  await assertChatPermission(userId, 'privacy.block', userRole);
  await ChatBlockedUser.findOneAndUpdate(
    { userId, blockedUserId },
    { blockId: id('BLK'), userId: new Types.ObjectId(userId), blockedUserId: new Types.ObjectId(blockedUserId), reason },
    { upsert: true }
  );
  return { blocked: true };
}

export async function unblockUser(userId: string, userRole: string | undefined, blockedUserId: string) {
  await assertChatPermission(userId, 'privacy.block', userRole);
  await ChatBlockedUser.deleteOne({ userId, blockedUserId });
  return { blocked: false };
}

export async function getPrivacySettings(userId: string, userRole?: string) {
  await assertChatPermission(userId, 'privacy.manage', userRole);
  let settings = await ChatPrivacySettings.findOne({ userId });
  if (!settings) settings = await ChatPrivacySettings.create({ userId: new Types.ObjectId(userId) });
  return settings.toObject();
}

export async function updatePrivacySettings(userId: string, userRole: string | undefined, updates: Record<string, unknown>) {
  await assertChatPermission(userId, 'privacy.manage', userRole);
  const settings = await ChatPrivacySettings.findOneAndUpdate(
    { userId },
    { $set: updates },
    { upsert: true, new: true }
  );
  return settings!.toObject();
}

export async function startCall(
  userId: string,
  userRole: string | undefined,
  input: { conversationId: string; callType: ChatCallType; recording?: boolean }
) {
  if (input.callType === 'voice') await assertChatPermission(userId, 'calls.voice', userRole);
  else if (input.callType === 'video') await assertChatPermission(userId, 'calls.video', userRole);
  else await assertChatPermission(userId, 'calls.conference', userRole);
  if (input.recording) await assertChatPermission(userId, 'calls.record', userRole);

  const call = await ChatCall.create({
    callId: id('CALL'),
    conversationId: input.conversationId,
    initiatorId: new Types.ObjectId(userId),
    callType: input.callType,
    status: 'ringing',
    recordingEnabled: input.recording ?? false,
    startedAt: new Date(),
  });

  const members = await ConversationMember.find({ conversationId: input.conversationId, deletedAt: null, leftAt: null });
  for (const m of members) {
    await ChatCallParticipant.create({
      participantId: id('PART'),
      callId: call.callId,
      userId: m.userId,
      muted: false,
      videoEnabled: input.callType !== 'voice',
      joinedAt: m.userId.toString() === userId ? new Date() : undefined,
    });
    if (m.userId.toString() !== userId) {
      emitChat(m.userId.toString(), 'chat:call:ringing', { callId: call.callId, callType: input.callType, from: userId });
    }
  }

  return { callId: call.callId, status: call.status, callType: call.callType };
}

export async function updateCallParticipant(
  userId: string,
  userRole: string | undefined,
  callId: string,
  updates: Partial<{ muted: boolean; onHold: boolean; speaker: boolean; videoEnabled: boolean; joined: boolean }>
) {
  await assertChatPermission(userId, 'calls.voice', userRole);
  const participant = await ChatCallParticipant.findOne({ callId, userId });
  if (!participant) throw new Error('NOT_IN_CALL');

  if (updates.muted !== undefined) participant.muted = updates.muted;
  if (updates.onHold !== undefined) participant.onHold = updates.onHold;
  if (updates.speaker !== undefined) participant.speaker = updates.speaker;
  if (updates.videoEnabled !== undefined) participant.videoEnabled = updates.videoEnabled;
  if (updates.joined) participant.joinedAt = new Date();
  await participant.save();

  const call = await ChatCall.findOne({ callId });
  if (call && call.status === 'ringing' && updates.joined) {
    call.status = 'active';
    await call.save();
  }

  emitChat(userId, 'chat:call:update', { callId, userId, ...updates });
  return participant.toObject();
}

export async function endCall(userId: string, userRole: string | undefined, callId: string) {
  await assertChatPermission(userId, 'calls.voice', userRole);
  const call = await ChatCall.findOne({ callId });
  if (!call) throw new Error('CALL_NOT_FOUND');

  call.status = 'ended';
  call.endedAt = new Date();
  call.durationSeconds = call.startedAt ? Math.floor((call.endedAt.getTime() - call.startedAt.getTime()) / 1000) : 0;
  await call.save();

  const participants = await ChatCallParticipant.find({ callId });
  for (const p of participants) {
    if (!p.leftAt) p.leftAt = new Date();
    await p.save();
    emitChat(p.userId.toString(), 'chat:call:ended', { callId, durationSeconds: call.durationSeconds });
  }

  return { callId, status: call.status, durationSeconds: call.durationSeconds };
}

export async function getCallHistory(userId: string, userRole?: string) {
  await assertChatPermission(userId, 'calls.voice', userRole);
  const memberships = await ConversationMember.find({ userId, deletedAt: null });
  const convIds = memberships.map((m) => m.conversationId);
  const calls = await ChatCall.find({ conversationId: { $in: convIds } }).sort({ createdAt: -1 }).limit(50);
  return calls.map((c) => ({
    callId: c.callId,
    conversationId: c.conversationId,
    callType: c.callType,
    status: c.status,
    durationSeconds: c.durationSeconds,
    startedAt: c.startedAt?.toISOString(),
    endedAt: c.endedAt?.toISOString(),
  }));
}

export async function createInviteLink(userId: string, userRole: string | undefined, conversationId: string, maxUses?: number) {
  await assertChatPermission(userId, 'groups.invite', userRole);
  const link = await ChatInviteLink.create({
    linkId: id('LINK'),
    conversationId,
    code: generateInviteCode(),
    createdBy: userId,
    maxUses: maxUses ?? 100,
  });
  return { linkId: link.linkId, code: link.code, conversationId };
}

export async function joinViaInvite(userId: string, userRole: string | undefined, code: string) {
  await assertChatPermission(userId, 'groups.invite', userRole);
  const link = await ChatInviteLink.findOne({ code, revoked: false });
  if (!link) throw new Error('INVALID_INVITE');
  if (link.expiresAt && link.expiresAt < new Date()) throw new Error('INVITE_EXPIRED');
  if (link.uses >= link.maxUses) throw new Error('INVITE_EXHAUSTED');

  await addMember(link.conversationId, link.createdBy, userId, CHAT_APP_BUNDLE, link.createdBy);
  link.uses += 1;
  await link.save();
  await ensureMeta(userId, link.conversationId, 'group');
  return { conversationId: link.conversationId };
}

export async function listJoinRequests(userId: string, userRole: string | undefined, conversationId: string) {
  await assertChatPermission(userId, 'groups.manage', userRole);
  return ChatJoinRequest.find({ conversationId, status: 'pending' });
}

export async function createJoinRequest(userId: string, userRole: string | undefined, conversationId: string, message?: string) {
  await assertChatPermission(userId, 'groups.invite', userRole);
  const request = await ChatJoinRequest.create({
    requestId: id('JOIN'),
    conversationId,
    userId: new Types.ObjectId(userId),
    message,
    status: 'pending',
  });
  return request.toObject();
}

export async function reviewJoinRequest(
  userId: string,
  userRole: string | undefined,
  requestId: string,
  action: 'approve' | 'reject'
) {
  await assertChatPermission(userId, 'groups.manage', userRole);
  const request = await ChatJoinRequest.findOne({ requestId });
  if (!request) throw new Error('REQUEST_NOT_FOUND');

  request.status = action === 'approve' ? 'approved' : 'rejected';
  request.reviewedBy = new Types.ObjectId(userId);
  await request.save();

  if (action === 'approve') {
    await addMember(request.conversationId, userId, request.userId.toString(), CHAT_APP_BUNDLE, userId);
  }
  return request.toObject();
}

export async function listTrustedDevices(userId: string, userRole?: string) {
  await assertChatPermission(userId, 'devices.trusted', userRole);
  return ChatTrustedDevice.find({ userId }).sort({ lastActiveAt: -1 });
}

export async function getConversationDetail(userId: string, userRole: string | undefined, conversationId: string) {
  await assertChatPermission(userId, 'chat.access', userRole);
  const conv = await getConversation(conversationId, userId);
  const members = await getConversationMembers(conversationId);
  const meta = await ChatConversationMeta.findOne({ userId, conversationId });
  return { ...conv, members, meta: meta?.toObject() };
}

export async function setTyping(userId: string, conversationId: string, isTyping: boolean) {
  if (isTyping) await startTyping(userId, conversationId);
  else await stopTyping(userId, conversationId);
  return { conversationId, isTyping };
}

export async function getChatPresence(userId: string, targetUserId?: string) {
  return getPresence(targetUserId ?? userId);
}

export async function updateChatPresence(userId: string, state: string, customStatus?: string) {
  return setPresence(userId, state as never, { customStatus });
}

export async function pinChatMessage(userId: string, userRole: string | undefined, conversationId: string, messageId: string) {
  await assertChatPermission(userId, 'chats.pin', userRole);
  return pinMessage(conversationId, messageId, userId, CHAT_APP_BUNDLE, userId);
}

export async function updateChatProfile(userId: string, userRole: string | undefined, updates: Record<string, unknown>) {
  await assertChatPermission(userId, 'chat.access', userRole);
  const profile = await ChatProfile.findOne({ userId, deletedAt: null });
  if (!profile) throw new Error('CHAT_NOT_INITIALIZED');

  if (updates.displayName !== undefined) profile.displayName = String(updates.displayName);
  if (updates.about !== undefined) profile.about = String(updates.about);
  if (updates.avatarUrl !== undefined) profile.avatarUrl = String(updates.avatarUrl);
  if (updates.biometricLock !== undefined) {
    await assertChatPermission(userId, 'privacy.biometric', userRole);
    profile.biometricLock = Boolean(updates.biometricLock);
  }
  await profile.save();
  return formatChatProfile(profile);
}

export async function getRbac(userId: string, userRole?: string) {
  await assertChatPermission(userId, 'audit.view', userRole);
  const profile = await getChatProfile(userId);
  const role = profile?.role ?? 'user';
  const permissions = await getRolePermissions(role);
  return { role, permissions };
}

export async function patchRbac(userId: string, userRole: string | undefined, role: string, permissions: string[]) {
  if (userRole !== 'admin') await assertChatPermission(userId, 'audit.view', userRole);
  return updateRolePermissions(role as never, permissions as never, userId);
}
