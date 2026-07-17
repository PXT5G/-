import { MESSAGES_APP_BUNDLE, MESSAGES_SOCKET_EVENTS } from '../constants/messagesApp';
import { checkPermission } from './permissionBrokerService';
import { emitToUser } from './socketService';
import { logAudit } from './auditService';
import {
  initializeCommunication,
  sendMessage,
  getMessages,
  searchCommunication,
} from './communicationService';
import { getUserConversations, getOrCreatePrivateConversation, createConversation } from './conversationService';
import { startTyping, stopTyping } from './typingService';
import { dispatchMessageNotification } from './notificationDispatcher';

async function assertMessages(userId: string) {
  const allowed = await checkPermission(userId, MESSAGES_APP_BUNDLE, 'notifications');
  if (!allowed) {
    const alt = await checkPermission(userId, MESSAGES_APP_BUNDLE, 'phone');
    if (!alt) throw new Error('MESSAGES_PERMISSION_DENIED');
  }
}

export async function initializeMessages(userId: string, actorId: string) {
  await initializeCommunication(userId);
  await logAudit({ userId, actorId, action: 'messages_initialize', resource: 'messages' });
  return { initialized: true };
}

export async function listConversations(userId: string) {
  await assertMessages(userId);
  return getUserConversations(userId);
}

export async function getSmsMessages(userId: string, conversationId: string, limit = 50) {
  await assertMessages(userId);
  return getMessages(userId, conversationId, { limit });
}

export async function sendSms(
  userId: string,
  input: { toUserId?: string; phoneNumber?: string; body: string; scheduledAt?: string },
  actorId: string
) {
  await assertMessages(userId);

  let conversationId: string;
  if (input.toUserId) {
    const conv = await getOrCreatePrivateConversation(userId, input.toUserId, MESSAGES_APP_BUNDLE);
    conversationId = conv.conversationId;
  } else {
    const conversations = await getUserConversations(userId);
    const existing = conversations.find((c) => c.title?.includes(input.phoneNumber ?? ''));
    if (existing) {
      conversationId = existing.conversationId;
    } else {
      const conv = await createConversation({
        type: 'private',
        title: input.phoneNumber ?? 'SMS',
        memberIds: [userId],
        creatorId: userId,
        appId: MESSAGES_APP_BUNDLE,
      });
      conversationId = conv.conversationId;
    }
  }

  const message = await sendMessage({
    userId,
    conversationId,
    appId: MESSAGES_APP_BUNDLE,
    body: input.body,
    messageType: 'sms',
    contentType: 'text',
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    actorId,
  });

  if (input.toUserId) {
    await dispatchMessageNotification({
      recipientId: input.toUserId,
      appId: MESSAGES_APP_BUNDLE,
      conversationId,
      messageId: message.messageId,
      messageType: 'sms',
      title: 'New Message',
      body: input.body,
      senderName: 'SMS',
      actorId,
    });
    emitToUser(input.toUserId, 'messages:new', { message, conversationId });
  }

  emitToUser(userId, 'messages:updated', { message, conversationId });
  await logAudit({ userId, actorId, action: 'sms_send', resource: 'message', resourceId: message.messageId });

  return message;
}

export async function searchMessages(userId: string, query: string) {
  await assertMessages(userId);
  return searchCommunication(userId, query, { type: 'messages' });
}

export async function setTyping(userId: string, conversationId: string, isTyping: boolean) {
  await assertMessages(userId);
  if (isTyping) {
    await startTyping(userId, conversationId);
    emitToUser(userId, 'messages:typing', { conversationId, userId, typing: true });
  } else {
    await stopTyping(userId, conversationId);
    emitToUser(userId, 'messages:typing', { conversationId, userId, typing: false });
  }
  return { conversationId, typing: isTyping };
}

export { MESSAGES_SOCKET_EVENTS };
