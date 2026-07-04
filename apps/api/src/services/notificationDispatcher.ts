import type { NotificationPriority } from '@gulfos/shared';
import type { MessageType } from '../constants/communication';
import { enqueueNotification } from './notificationBrokerService';

function priorityForMessageType(messageType: MessageType): NotificationPriority {
  switch (messageType) {
    case 'emergency':
    case 'police':
      return 'critical';
    case 'justice':
    case 'bank':
    case 'verification':
      return 'high';
    case 'silent':
    case 'hidden':
      return 'low';
    default:
      return 'normal';
  }
}

export async function dispatchMessageNotification(params: {
  recipientId: string;
  appId: string;
  conversationId: string;
  messageId: string;
  messageType: MessageType;
  title: string;
  body: string;
  senderName: string;
  silent?: boolean;
  hidden?: boolean;
  actorId?: string;
}) {
  if (params.messageType === 'silent' || params.silent) {
    return enqueueNotification({
      userId: params.recipientId,
      appId: params.appId,
      title: params.title,
      body: params.body,
      priority: 'low',
      silent: true,
      headsUp: false,
      lockScreen: false,
      dynamicIsland: false,
      groupId: params.conversationId,
      deepLink: `gulfos://communication/${params.conversationId}/${params.messageId}`,
      actorId: params.actorId,
    });
  }

  const priority = priorityForMessageType(params.messageType);
  const previewHidden = params.hidden || params.messageType === 'hidden';

  return enqueueNotification({
    userId: params.recipientId,
    appId: params.appId,
    title: previewHidden ? 'New Message' : params.title,
    body: previewHidden ? 'You have a new message' : `${params.senderName}: ${params.body}`,
    priority,
    silent: false,
    headsUp: priority === 'high' || priority === 'critical',
    lockScreen: true,
    dynamicIsland: priority !== 'low',
    groupId: params.conversationId,
    deepLink: `gulfos://communication/${params.conversationId}/${params.messageId}`,
    actorId: params.actorId,
  });
}

export async function dispatchEmergencyNotification(params: {
  recipientId: string;
  appId: string;
  title: string;
  body: string;
  conversationId: string;
  actorId?: string;
}) {
  return enqueueNotification({
    userId: params.recipientId,
    appId: params.appId,
    title: params.title,
    body: params.body,
    priority: 'critical',
    silent: false,
    headsUp: true,
    lockScreen: true,
    dynamicIsland: true,
    groupId: params.conversationId,
    deepLink: `gulfos://communication/${params.conversationId}`,
    actorId: params.actorId,
  });
}
