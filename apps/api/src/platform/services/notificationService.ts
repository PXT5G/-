import { Notification } from '../../database/models/Notification';
import type { NotificationPriority, SocketEvent } from '@bananaos/shared';
import { BANANAOS_APP_IDS } from '../types';
import type { SendNotificationParams } from '../types';
import { eventBusService } from './eventBusService';
import { auditService } from './auditService';

const APP_ICONS: Record<string, string> = {
  [BANANAOS_APP_IDS.IDENTITY]: '🪪',
  [BANANAOS_APP_IDS.BANK]: '🏦',
  [BANANAOS_APP_IDS.SIM]: '📶',
  [BANANAOS_APP_IDS.CONTACTS]: '👤',
  [BANANAOS_APP_IDS.POLICE]: '🚔',
  [BANANAOS_APP_IDS.JUSTICE]: '⚖️',
};

const APP_DOMAIN_NOTIFICATION_EVENTS: Partial<Record<string, SocketEvent>> = {
  [BANANAOS_APP_IDS.BANK]: 'bank:notification',
  [BANANAOS_APP_IDS.SIM]: 'sim:notification',
  [BANANAOS_APP_IDS.CONTACTS]: 'contacts:notification',
  [BANANAOS_APP_IDS.POLICE]: 'police:notification',
};

export async function send(params: SendNotificationParams): Promise<{ id: string }> {
  const icon = params.icon ?? APP_ICONS[params.appId] ?? '🔔';
  const priority: NotificationPriority = params.priority ?? 'normal';

  const notification = await Notification.create({
    userId: params.userId,
    appId: params.appId,
    title: params.title,
    body: params.body,
    icon,
    priority,
    groupId: params.groupId,
  });

  const formatted = {
    id: notification._id.toString(),
    appId: params.appId,
    title: params.title,
    body: params.body,
    icon,
    priority,
    read: false,
    createdAt: notification.createdAt.toISOString(),
  };

  eventBusService.emitToUser(params.userId, 'notification:new', formatted);

  const domainEvent = params.domainEvent ?? APP_DOMAIN_NOTIFICATION_EVENTS[params.appId];
  if (domainEvent) {
    eventBusService.emitToUser(params.userId, domainEvent, params.domainPayload ?? { title: params.title, body: params.body, priority });
  }

  return { id: notification._id.toString() };
}

export async function sendBulk(
  userIds: string[],
  params: Omit<SendNotificationParams, 'userId'>
): Promise<number> {
  let sent = 0;
  for (const userId of userIds) {
    await send({ ...params, userId });
    sent++;
  }
  return sent;
}

export async function sendSystemBroadcast(
  title: string,
  body: string,
  options?: { priority?: NotificationPriority; performedBy?: string }
): Promise<number> {
  const { User } = await import('../../database/models/User');
  const users = await User.find({}).select('_id').limit(1000).lean();

  for (const user of users) {
    await send({
      userId: user._id.toString(),
      appId: BANANAOS_APP_IDS.SETTINGS,
      title,
      body,
      icon: '📢',
      priority: options?.priority ?? 'high',
    });
  }

  eventBusService.broadcast('system:broadcast', { title, body });

  if (options?.performedBy) {
    await auditService.log({
      appId: BANANAOS_APP_IDS.SETTINGS,
      userId: options.performedBy,
      action: 'system_broadcast',
      entityType: 'Notification',
      ctx: { performedBy: options.performedBy, performedByRole: 'admin' },
      metadata: { recipientCount: users.length, title },
    });
  }

  return users.length;
}

export const notificationService = { send, sendBulk, sendSystemBroadcast };
