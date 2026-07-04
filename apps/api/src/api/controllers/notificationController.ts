import { Response } from 'express';
import { Notification } from '../../database/models/Notification';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { eventBusService } from '../../platform';

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { limit = '50', unreadOnly } = req.query;
  const filter: Record<string, unknown> = { userId: req.user!.userId };
  if (unreadOnly === 'true') {
    filter.read = false;
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit as string, 10));

  res.json({
    success: true,
    data: notifications.map(formatNotification),
  });
});

export const createNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId, title, body, icon, image, priority, actions, groupId } = req.body;

  const notification = await Notification.create({
    userId: req.user!.userId,
    appId,
    title,
    body,
    icon,
    image,
    priority: priority ?? 'normal',
    actions,
    groupId,
  });

  const formatted = formatNotification(notification);
  eventBusService.emitToUser(req.user!.userId, 'notification:new', formatted);

  res.status(201).json({ success: true, data: formatted });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: req.user!.userId },
    { read: true },
    { new: true }
  );

  if (!notification) {
    throw new AppError(404, 'Notification not found');
  }

  eventBusService.emitToUser(req.user!.userId, 'notification:read', { id });

  res.json({ success: true, data: formatNotification(notification) });
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.updateMany(
    { userId: req.user!.userId, read: false },
    { read: true }
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});

export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await Notification.deleteOne({ _id: id, userId: req.user!.userId });

  if (result.deletedCount === 0) {
    throw new AppError(404, 'Notification not found');
  }

  res.json({ success: true, message: 'Notification deleted' });
});

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
