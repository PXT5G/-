import { Types } from 'mongoose';
import type { NotificationPriority } from '@gulfos/shared';
import { Notification } from '../database/models/Notification';
import { NotificationQueue } from '../database/models/NotificationQueue';
import { emitToUser } from './socketService';
import { logAudit } from './auditService';
import { checkPermission } from './permissionBrokerService';
import { dispatchToNotificationProviders } from './notificationProviderRegistry';

export interface BrokerNotificationInput {
  userId: string;
  appId: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  priority?: NotificationPriority;
  silent?: boolean;
  headsUp?: boolean;
  lockScreen?: boolean;
  dynamicIsland?: boolean;
  groupId?: string;
  actions?: { id: string; label: string; destructive?: boolean }[];
  deepLink?: string;
  scheduledAt?: Date;
  actorId?: string;
}

function formatNotification(notification: InstanceType<typeof Notification>) {
  return {
    id: notification._id.toString(),
    appId: notification.appId,
    title: notification.title,
    body: notification.body,
    icon: notification.icon,
    image: notification.image,
    priority: notification.priority,
    timestamp: notification.createdAt.toISOString(),
    read: notification.read,
    actions: notification.actions,
    groupId: notification.groupId,
  };
}

export async function enqueueNotification(input: BrokerNotificationInput) {
  const allowed = await checkPermission(input.userId, input.appId, 'notifications');
  if (!allowed && input.appId !== 'com.gulfos.system') {
    throw new Error('PERMISSION_DENIED');
  }

  const queued = await NotificationQueue.create({
    userId: new Types.ObjectId(input.userId),
    appId: input.appId,
    title: input.title,
    body: input.body,
    icon: input.icon,
    image: input.image,
    priority: input.priority ?? 'normal',
    silent: input.silent ?? false,
    headsUp: input.headsUp ?? true,
    lockScreen: input.lockScreen ?? true,
    dynamicIsland: input.dynamicIsland ?? (input.priority === 'high' || input.priority === 'critical'),
    groupId: input.groupId,
    actions: input.actions,
    deepLink: input.deepLink,
    scheduledAt: input.scheduledAt,
    createdBy: input.actorId ? new Types.ObjectId(input.actorId) : undefined,
  });

  if (!input.scheduledAt || input.scheduledAt <= new Date()) {
    return deliverNotification(queued._id.toString());
  }

  return { queued: true, id: queued._id.toString(), deliveryState: 'pending' };
}

export async function deliverNotification(queueId: string) {
  const queued = await NotificationQueue.findById(queueId);
  if (!queued || queued.deliveryState === 'delivered') {
    throw new Error('NOTIFICATION_NOT_FOUND');
  }

  const notification = await Notification.create({
    userId: queued.userId,
    appId: queued.appId,
    title: queued.title,
    body: queued.body,
    icon: queued.icon,
    image: queued.image,
    priority: queued.priority,
    groupId: queued.groupId,
    actions: queued.actions,
  });

  queued.deliveryState = 'delivered';
  queued.deliveredAt = new Date();
  await queued.save();

  const formatted = formatNotification(notification);
  const payload = {
    ...formatted,
    silent: queued.silent,
    headsUp: queued.headsUp,
    lockScreen: queued.lockScreen,
    dynamicIsland: queued.dynamicIsland,
    deepLink: queued.deepLink,
  };

  await dispatchToNotificationProviders({
    userId: queued.userId.toString(),
    appId: queued.appId,
    notificationId: notification._id.toString(),
    queueId: queued._id.toString(),
    title: queued.title,
    body: queued.body,
    priority: queued.priority,
    payload,
  });

  return formatted;
}

export async function processPendingNotifications(): Promise<number> {
  const pending = await NotificationQueue.find({
    deliveryState: 'pending',
    deletedAt: null,
    $or: [{ scheduledAt: null }, { scheduledAt: { $lte: new Date() } }],
  }).limit(20);

  for (const item of pending) {
    try {
      await deliverNotification(item._id.toString());
    } catch {
      item.deliveryState = 'failed';
      await item.save();
    }
  }
  return pending.length;
}

export async function markNotificationRead(userId: string, id: string, actorId: string) {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { read: true },
    { new: true }
  );
  if (!notification) throw new Error('NOTIFICATION_NOT_FOUND');

  await NotificationQueue.updateMany(
    { userId, appId: notification.appId, title: notification.title },
    { read: true }
  );

  await logAudit({ userId, actorId, action: 'read', resource: 'notification', resourceId: id });
  emitToUser(userId, 'notification:read', { id });
  return formatNotification(notification);
}

export async function dismissNotification(userId: string, id: string, actorId: string) {
  await NotificationQueue.updateMany(
    { userId, _id: id },
    { dismissed: true, deliveryState: 'dismissed' }
  );
  await logAudit({ userId, actorId, action: 'dismiss', resource: 'notification', resourceId: id });
  return { dismissed: true };
}

export async function getNotificationQueue(userId: string) {
  const items = await NotificationQueue.find({ userId, deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(50);
  return items.map((i) => ({
    id: i._id.toString(),
    appId: i.appId,
    title: i.title,
    body: i.body,
    priority: i.priority,
    deliveryState: i.deliveryState,
    read: i.read,
    dismissed: i.dismissed,
    scheduledAt: i.scheduledAt?.toISOString(),
    deliveredAt: i.deliveredAt?.toISOString(),
    createdAt: i.createdAt.toISOString(),
  }));
}
