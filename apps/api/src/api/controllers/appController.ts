import { Response } from 'express';
import { App } from '../../database/models/App';
import { InstalledApp } from '../../database/models/InstalledApp';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { emitToUser } from '../../services/socketService';

export const getCatalog = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const apps = await App.find({ isPublished: true }).sort({ name: 1 });
  res.json({
    success: true,
    data: apps.map(formatApp),
  });
});

export const getInstalled = asyncHandler(async (req: AuthRequest, res: Response) => {
  const installed = await InstalledApp.find({ userId: req.user!.userId })
    .populate('appId')
    .sort({ pageIndex: 1, 'position.row': 1, 'position.col': 1 });

  res.json({
    success: true,
    data: installed.map((item) => ({
      ...formatApp(item.appId as unknown as InstanceType<typeof App>),
      installedAt: item.installedAt.toISOString(),
      position: item.position,
      folderId: item.folderId,
      pageIndex: item.pageIndex,
    })),
  });
});

export const installApp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bundleId } = req.params;
  const app = await App.findOne({ bundleId, isPublished: true });
  if (!app) {
    throw new AppError(404, 'App not found');
  }

  const existing = await InstalledApp.findOne({
    userId: req.user!.userId,
    bundleId,
  });
  if (existing) {
    throw new AppError(409, 'App already installed');
  }

  const { pageIndex = 0, position } = req.body as {
    pageIndex?: number;
    position?: { row: number; col: number };
  };

  const installed = await InstalledApp.create({
    userId: req.user!.userId,
    appId: app._id,
    bundleId: app.bundleId,
    pageIndex,
    position,
  });

  emitToUser(req.user!.userId, 'app:installed', formatApp(app));

  res.status(201).json({
    success: true,
    data: {
      ...formatApp(app),
      installedAt: installed.installedAt.toISOString(),
      position: installed.position,
      pageIndex: installed.pageIndex,
    },
  });
});

export const uninstallApp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bundleId } = req.params;
  const result = await InstalledApp.deleteOne({
    userId: req.user!.userId,
    bundleId,
  });

  if (result.deletedCount === 0) {
    throw new AppError(404, 'App not installed');
  }

  emitToUser(req.user!.userId, 'app:uninstalled', { bundleId });

  res.json({ success: true, message: 'App uninstalled' });
});

export const updateLayout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { layout } = req.body as {
    layout: Array<{
      bundleId: string;
      pageIndex: number;
      position?: { row: number; col: number };
      folderId?: string;
    }>;
  };

  const updates = layout.map((item) =>
    InstalledApp.updateOne(
      { userId: req.user!.userId, bundleId: item.bundleId },
      {
        pageIndex: item.pageIndex,
        position: item.position,
        folderId: item.folderId ?? null,
      }
    )
  );

  await Promise.all(updates);
  res.json({ success: true, message: 'Layout updated' });
});

function formatApp(app: InstanceType<typeof App>) {
  return {
    id: app._id.toString(),
    bundleId: app.bundleId,
    name: app.name,
    version: app.version,
    description: app.description,
    icon: app.icon,
    category: app.category,
    permissions: app.permissions,
    minOSVersion: app.minOSVersion,
    isSystemApp: app.isSystemApp,
    route: app.route,
    entryPoint: app.entryPoint,
  };
}
