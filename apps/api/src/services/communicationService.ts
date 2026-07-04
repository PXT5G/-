import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { Message } from '../database/models/Message';
import { Conversation } from '../database/models/Conversation';
import { ConversationMember } from '../database/models/ConversationMember';
import { User } from '../database/models/User';
import { Announcement } from '../database/models/Announcement';
import type { MessageType, ContentType } from '../constants/communication';
import { MESSAGE_PAGE_SIZE } from '../constants/communication';
import { checkPermission } from './permissionBrokerService';
import { extractMentions } from './mentionService';
import { encryptMessage, getConversationKeyMaterial } from './encryptionService';
import { createDeliveryStatuses } from './deliveryService';
import { dispatchMessageNotification } from './notificationDispatcher';
import { logCommunicationAudit } from './communicationAuditService';
import { getMessageAttachments } from './attachmentService';
import { getMessageReactions } from './reactionService';
import { getDeliveryStatus } from './deliveryService';
import { emitToUser } from './socketService';
import { publishEvent } from './eventBusService';
import { getNetwork } from './networkService';
import { setPresence } from './presenceService';

export interface SendMessageInput {
  userId: string;
  appId: string;
  conversationId: string;
  body: string;
  messageType?: MessageType;
  contentType?: ContentType;
  replyToMessageId?: string;
  forwardFromMessageId?: string;
  metadata?: Record<string, unknown>;
  scheduledAt?: Date;
  expiresAt?: Date;
  autoDeleteAt?: Date;
  silent?: boolean;
  hidden?: boolean;
  clientMessageId?: string;
  actorId: string;
}

function formatMessage(msg: InstanceType<typeof Message>, attachments: unknown[] = [], reactions: unknown[] = []) {
  return {
    messageId: msg.messageId,
    conversationId: msg.conversationId,
    senderId: msg.senderId.toString(),
    senderAppId: msg.senderAppId,
    messageType: msg.messageType,
    contentType: msg.contentType,
    body: msg.deletedForEveryone ? '' : msg.body,
    replyToMessageId: msg.replyToMessageId,
    forwardFromMessageId: msg.forwardFromMessageId,
    mentions: msg.mentions,
    metadata: msg.metadata,
    scheduledAt: msg.scheduledAt?.toISOString(),
    sentAt: msg.sentAt?.toISOString(),
    expiresAt: msg.expiresAt?.toISOString(),
    autoDeleteAt: msg.autoDeleteAt?.toISOString(),
    editedAt: msg.editedAt?.toISOString(),
    deletedForEveryone: msg.deletedForEveryone,
    hidden: msg.hidden,
    silent: msg.silent,
    pinned: msg.pinned,
    deliveryState: msg.deliveryState,
    attachments,
    reactions,
    createdAt: msg.createdAt.toISOString(),
  };
}

async function assertCanSend(userId: string, conversationId: string, appId: string) {
  const member = await ConversationMember.findOne({ conversationId, userId, deletedAt: null, leftAt: null });
  if (!member) throw new Error('NOT_A_MEMBER');

  const conv = await Conversation.findOne({ conversationId, deletedAt: null });
  if (!conv) throw new Error('CONVERSATION_NOT_FOUND');
  if (conv.announcementOnly && !['owner', 'admin', 'moderator'].includes(member.role)) {
    throw new Error('ANNOUNCEMENT_ONLY');
  }

  const allowed = await checkPermission(userId, appId, 'contacts');
  if (!allowed && appId !== 'com.gulfos.system' && appId !== 'com.gulfos.communication' && appId !== 'com.gulfos.chat' && appId !== 'com.gulfos.messages' && appId !== 'com.gulfos.phone' && appId !== 'com.gulfos.mail' && appId !== 'com.gulfos.justice' && appId !== 'com.gulfos.ems' && appId !== 'com.gulfos.business' && appId !== 'com.gulfos.real-estate' && appId !== 'com.gulfos.vehicles' && appId !== 'com.gulfos.aviation' && appId !== 'com.gulfos.marine' && appId !== 'com.gulfos.economy-engine' && appId !== 'com.gulfos.exchange') {
    throw new Error('PERMISSION_DENIED');
  }

  const net = await getNetwork(userId);
  if (!net.internetConnected && appId !== 'com.gulfos.system') {
    throw new Error('NO_NETWORK');
  }

  return { member, conv };
}

export async function sendMessage(input: SendMessageInput) {
  await assertCanSend(input.userId, input.conversationId, input.appId);

  const messageId = input.clientMessageId ?? uuidv4();
  const existing = await Message.findOne({ messageId });
  if (existing) return formatMessage(existing);

  const mentions = extractMentions(input.body);
  const { keyId, key } = await getConversationKeyMaterial(input.conversationId);
  const { encrypted, signature } = encryptMessage(input.body, key);

  const isScheduled = input.scheduledAt && input.scheduledAt > new Date();

  const message = await Message.create({
    messageId,
    conversationId: input.conversationId,
    senderId: new Types.ObjectId(input.userId),
    senderAppId: input.appId,
    messageType: input.messageType ?? 'private_chat',
    contentType: input.contentType ?? 'text',
    body: input.body,
    encryptedBody: encrypted,
    signature,
    conversationKeyId: keyId,
    replyToMessageId: input.replyToMessageId,
    forwardFromMessageId: input.forwardFromMessageId,
    mentions,
    metadata: input.metadata ?? {},
    scheduledAt: input.scheduledAt,
    sentAt: isScheduled ? undefined : new Date(),
    expiresAt: input.expiresAt,
    autoDeleteAt: input.autoDeleteAt,
    silent: input.silent ?? false,
    hidden: input.hidden ?? false,
    deliveryState: isScheduled ? 'queued' : 'sending',
    createdBy: new Types.ObjectId(input.actorId),
  });

  if (!isScheduled) {
    await deliverMessage(message, input.actorId);
  }

  await logCommunicationAudit({
    userId: input.userId,
    actorId: input.actorId,
    appId: input.appId,
    action: 'message_send',
    resource: 'message',
    resourceId: messageId,
    conversationId: input.conversationId,
    messageId,
    metadata: { messageType: message.messageType, contentType: message.contentType },
  });

  return formatMessage(message);
}

export async function deliverMessage(message: InstanceType<typeof Message>, actorId: string) {
  if (!message.sentAt) {
    message.sentAt = new Date();
    message.deliveryState = 'sent';
    await message.save();
  }

  await Conversation.findOneAndUpdate(
    { conversationId: message.conversationId },
    { lastMessageAt: message.sentAt, lastMessagePreview: message.body.slice(0, 120) }
  );

  await createDeliveryStatuses(message.messageId, message.conversationId, message.senderId.toString());

  const formatted = formatMessage(message);
  const members = await ConversationMember.find({
    conversationId: message.conversationId,
    deletedAt: null,
    leftAt: null,
  });

  const sender = await User.findById(message.senderId);
  const senderName = sender?.displayName ?? sender?.username ?? 'Unknown';

  for (const m of members) {
    const uid = m.userId.toString();
    emitToUser(uid, 'message:new', formatted);
    if (uid !== message.senderId.toString() && !message.silent) {
      await dispatchMessageNotification({
        recipientId: uid,
        appId: message.senderAppId,
        conversationId: message.conversationId,
        messageId: message.messageId,
        messageType: message.messageType,
        title: 'New Message',
        body: message.body.slice(0, 100),
        senderName,
        silent: message.silent,
        hidden: message.hidden,
        actorId,
      });
    }
  }

  await publishEvent({
    userId: message.senderId.toString(),
    namespace: 'communication.messages',
    event: 'message:sent',
    payload: formatted,
    source: 'communicationService',
  });

  return formatted;
}

export async function deliverScheduledMessage(messageId: string) {
  const message = await Message.findOne({ messageId, deletedAt: null });
  if (!message || message.sentAt) return null;
  return deliverMessage(message, message.senderId.toString());
}

export async function getMessages(
  userId: string,
  conversationId: string,
  options?: { before?: string; limit?: number }
) {
  const member = await ConversationMember.findOne({ conversationId, userId, deletedAt: null, leftAt: null });
  if (!member) throw new Error('NOT_A_MEMBER');

  const limit = Math.min(options?.limit ?? MESSAGE_PAGE_SIZE, 100);
  const filter: Record<string, unknown> = {
    conversationId,
    deletedAt: null,
    deletedForEveryone: false,
    deletedForUsers: { $ne: new Types.ObjectId(userId) },
  };

  if (options?.before) {
    const beforeMsg = await Message.findOne({ messageId: options.before });
    if (beforeMsg?.sentAt) filter.sentAt = { $lt: beforeMsg.sentAt };
  }

  const messages = await Message.find(filter).sort({ sentAt: -1 }).limit(limit);
  const results = [];
  for (const msg of messages) {
    const attachments = await getMessageAttachments(msg.messageId);
    const reactions = await getMessageReactions(msg.messageId);
    results.push(formatMessage(msg, attachments, reactions));
  }
  return results.reverse();
}

export async function getMessage(messageId: string, userId: string) {
  const message = await Message.findOne({ messageId, deletedAt: null });
  if (!message) throw new Error('MESSAGE_NOT_FOUND');
  const member = await ConversationMember.findOne({ conversationId: message.conversationId, userId, deletedAt: null });
  if (!member) throw new Error('NOT_A_MEMBER');
  const attachments = await getMessageAttachments(messageId);
  const reactions = await getMessageReactions(messageId);
  const delivery = await getDeliveryStatus(messageId);
  return { ...formatMessage(message, attachments, reactions), delivery };
}

export async function editMessage(messageId: string, userId: string, body: string, appId: string, actorId: string) {
  const message = await Message.findOne({ messageId, senderId: userId, deletedAt: null });
  if (!message) throw new Error('MESSAGE_NOT_FOUND');
  if (message.deletedForEveryone) throw new Error('MESSAGE_DELETED');

  const { keyId, key } = await getConversationKeyMaterial(message.conversationId);
  const { encrypted, signature } = encryptMessage(body, key);

  message.body = body;
  message.encryptedBody = encrypted;
  message.signature = signature;
  message.conversationKeyId = keyId;
  message.mentions = extractMentions(body);
  message.editedAt = new Date();
  message.updatedBy = new Types.ObjectId(actorId);
  await message.save();

  const formatted = formatMessage(message);
  const members = await ConversationMember.find({ conversationId: message.conversationId, deletedAt: null, leftAt: null });
  for (const m of members) {
    emitToUser(m.userId.toString(), 'message:edited', formatted);
  }

  await logCommunicationAudit({ userId, actorId, appId, action: 'message_edit', resource: 'message', messageId, conversationId: message.conversationId });
  return formatted;
}

export async function deleteMessageForMe(messageId: string, userId: string, appId: string, actorId: string) {
  const message = await Message.findOne({ messageId, deletedAt: null });
  if (!message) throw new Error('MESSAGE_NOT_FOUND');
  if (!message.deletedForUsers.some((id) => id.toString() === userId)) {
    message.deletedForUsers.push(new Types.ObjectId(userId));
    await message.save();
  }
  await logCommunicationAudit({ userId, actorId, appId, action: 'message_delete_me', resource: 'message', messageId, conversationId: message.conversationId });
  return { messageId, deleted: true };
}

export async function deleteMessageForEveryone(messageId: string, userId: string, appId: string, actorId: string) {
  const message = await Message.findOne({ messageId, senderId: userId, deletedAt: null });
  if (!message) throw new Error('MESSAGE_NOT_FOUND');

  message.deletedForEveryone = true;
  message.body = '';
  message.encryptedBody = undefined;
  message.updatedBy = new Types.ObjectId(actorId);
  await message.save();

  const members = await ConversationMember.find({ conversationId: message.conversationId, deletedAt: null, leftAt: null });
  for (const m of members) {
    emitToUser(m.userId.toString(), 'message:deleted', { messageId, conversationId: message.conversationId, forEveryone: true });
  }

  await logCommunicationAudit({ userId, actorId, appId, action: 'message_delete_everyone', resource: 'message', messageId, conversationId: message.conversationId });
  return { messageId, deletedForEveryone: true };
}

export async function forwardMessage(
  messageId: string,
  userId: string,
  targetConversationId: string,
  appId: string,
  actorId: string
) {
  const original = await Message.findOne({ messageId, deletedAt: null });
  if (!original) throw new Error('MESSAGE_NOT_FOUND');

  return sendMessage({
    userId,
    appId,
    conversationId: targetConversationId,
    body: original.body,
    messageType: original.messageType,
    contentType: original.contentType,
    forwardFromMessageId: messageId,
    metadata: { forwarded: true, originalSender: original.senderId.toString() },
    actorId,
  });
}

export async function searchCommunication(userId: string, query: string, options?: { type?: string; limit?: number }) {
  const memberships = await ConversationMember.find({ userId, deletedAt: null, leftAt: null });
  const conversationIds = memberships.map((m) => m.conversationId);
  const limit = options?.limit ?? 30;
  const results: Array<Record<string, unknown>> = [];

  if (!options?.type || options.type === 'messages') {
    const messages = await Message.find({
      conversationId: { $in: conversationIds },
      deletedAt: null,
      deletedForEveryone: false,
      body: new RegExp(query, 'i'),
    }).limit(limit);
    for (const m of messages) {
      results.push({ type: 'message', ...formatMessage(m) });
    }
  }

  if (!options?.type || options.type === 'users') {
    const users = await User.find({
      $or: [
        { username: new RegExp(query, 'i') },
        { displayName: new RegExp(query, 'i') },
      ],
    }).limit(limit);
    for (const u of users) {
      results.push({ type: 'user', userId: u._id.toString(), username: u.username, displayName: u.displayName });
    }
  }

  if (!options?.type || options.type === 'groups') {
    const convs = await Conversation.find({
      conversationId: { $in: conversationIds },
      title: new RegExp(query, 'i'),
      deletedAt: null,
    }).limit(limit);
    for (const c of convs) {
      results.push({ type: 'conversation', conversationId: c.conversationId, title: c.title, conversationType: c.type });
    }
  }

  if (!options?.type || options.type === 'files' || options?.type === 'media') {
    const { MessageAttachment } = await import('../database/models/MessageAttachment');
    const mimeFilter = options?.type === 'media'
      ? { mimeType: { $regex: /^(image|video|audio)\// } }
      : {};
    const attachments = await MessageAttachment.find({
      conversationId: { $in: conversationIds },
      fileName: new RegExp(query, 'i'),
      uploadState: 'ready',
      deletedAt: null,
      ...mimeFilter,
    }).limit(limit);
    for (const a of attachments) {
      results.push({ type: 'file', attachmentId: a.attachmentId, fileName: a.fileName, mimeType: a.mimeType, messageId: a.messageId });
    }
  }

  return results.slice(0, limit);
}

export async function createAnnouncement(params: {
  userId: string;
  conversationId: string;
  title: string;
  body: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  appId: string;
  actorId: string;
}) {
  const announcementId = uuidv4();
  const announcement = await Announcement.create({
    announcementId,
    conversationId: params.conversationId,
    authorId: new Types.ObjectId(params.userId),
    title: params.title,
    body: params.body,
    priority: params.priority ?? 'normal',
    publishedAt: new Date(),
    createdBy: new Types.ObjectId(params.actorId),
  });

  await sendMessage({
    userId: params.userId,
    appId: params.appId,
    conversationId: params.conversationId,
    body: params.body,
    messageType: 'announcement',
    contentType: 'text',
    metadata: { announcementId, title: params.title, priority: params.priority },
    actorId: params.actorId,
  });

  return {
    announcementId,
    conversationId: params.conversationId,
    title: params.title,
    publishedAt: announcement.publishedAt?.toISOString(),
  };
}

export async function initializeCommunication(userId: string) {
  const { ensurePresence } = await import('./presenceService');
  await ensurePresence(userId);
  await setPresence(userId, 'online', { actorId: userId });
  return { ready: true, userId };
}

export async function communicationTick(): Promise<{ delivery: number; typing: number; presence: number; scheduled: number; expired: number }> {
  const { processDeliveryQueue } = await import('./deliveryService');
  const { expireTypingStatuses } = await import('./typingService');
  const { tickPresenceIdle } = await import('./presenceService');
  const { processScheduledMessages, expireAutoDeleteMessages } = await import('./syncService');

  const [delivery, typing, presence, scheduled, expired] = await Promise.all([
    processDeliveryQueue(),
    expireTypingStatuses(),
    tickPresenceIdle(),
    processScheduledMessages(),
    expireAutoDeleteMessages(),
  ]);

  return { delivery, typing, presence, scheduled, expired };
}
