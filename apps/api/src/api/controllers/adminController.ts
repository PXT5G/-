import { Response } from 'express';
import { User } from '../../database/models/User';
import { Session } from '../../database/models/Session';
import { App } from '../../database/models/App';
import { Notification } from '../../database/models/Notification';
import { InstalledApp } from '../../database/models/InstalledApp';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { getConnectedUsers } from '../../services/socketService';
import { getDatabaseHealth } from '../../database/connection';

export const getDashboard = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [userCount, appCount, notificationCount, sessionCount] = await Promise.all([
    User.countDocuments(),
    App.countDocuments(),
    Notification.countDocuments(),
    Session.countDocuments(),
  ]);

  res.json({
    success: true,
    data: {
      users: userCount,
      apps: appCount,
      notifications: notificationCount,
      activeSessions: sessionCount,
      connectedSockets: getConnectedUsers(),
      database: getDatabaseHealth(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  });
});

export const getUsers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const users = await User.find().select('-password -pin').sort({ createdAt: -1 }).limit(100);
  res.json({
    success: true,
    data: users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    })),
  });
});

export const broadcast = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message, title } = req.body as { message: string; title?: string };
  const users = await User.find().select('_id');

  const notifications = users.map((user) => ({
    userId: user._id,
    appId: 'system',
    title: title ?? 'System Broadcast',
    body: message,
    priority: 'high' as const,
  }));

  await Notification.insertMany(notifications);

  res.json({
    success: true,
    message: `Broadcast sent to ${users.length} users`,
  });
});

export const seedSystemApps = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const systemApps = [
    {
      bundleId: 'com.bananaos.settings',
      name: 'Settings',
      version: '1.0.0',
      description: 'System settings and preferences',
      icon: '⚙️',
      category: 'system' as const,
      permissions: [] as const,
      isSystemApp: true,
      route: '/settings',
    },
  ];

  for (const app of systemApps) {
    await App.findOneAndUpdate({ bundleId: app.bundleId }, app, { upsert: true });
  }

  res.json({ success: true, message: 'System apps seeded' });
});
