import { Response } from 'express';
import { z } from 'zod';
import { App } from '../../database/models/App';
import { Developer } from '../../database/models/Developer';
import { StoreListing } from '../../database/models/StoreListing';
import { StoreReview } from '../../database/models/StoreReview';
import { AppVersion } from '../../database/models/AppVersion';
import { StoreDownload } from '../../database/models/StoreDownload';
import { InstalledApp } from '../../database/models/InstalledApp';
import { UserStoreSettings } from '../../database/models/UserStoreSettings';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { enqueueDownload, prepareDownloadStorage } from '../../services/downloadManager';
import { getPackageManifest, getStorageRequired } from '../../services/packageService';
import { getAppStorage, clearAppCache, clearAppData } from '../../services/storageService';
import { getUserRegistry, getRegistryEntry } from '../../services/appRegistryService';
import { checkForUpdates, getChangelog, startUpdate, setAutoUpdate } from '../../services/updateService';
import { checkAvailableStorage } from '../../services/deviceStorageService';
import { executeUninstall } from '../../services/installService';
import {
  pauseDownload,
  resumeDownload,
  cancelDownload,
  retryDownload,
  getDownloadQueue,
} from '../../services/downloadManager';

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

const installBodySchema = z.object({
  approvedPermissions: z.array(z.string()).optional(),
});

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(2000),
});

const STORE_CATEGORIES = [
  { id: 'productivity', name: 'Productivity', icon: '📊' },
  { id: 'communication', name: 'Communication', icon: '💬' },
  { id: 'media', name: 'Media', icon: '🎬' },
  { id: 'utilities', name: 'Utilities', icon: '🔧' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'social', name: 'Social', icon: '👥' },
  { id: 'system', name: 'System', icon: '⚙️' },
];

async function formatStoreApp(listing: InstanceType<typeof StoreListing>, app: InstanceType<typeof App>) {
  const developer = await Developer.findById(listing.developerId);
  return {
    id: listing._id.toString(),
    appId: app._id.toString(),
    bundleId: listing.bundleId,
    name: app.name,
    version: app.version,
    description: app.description,
    tagline: listing.tagline,
    longDescription: listing.longDescription,
    icon: app.icon,
    category: listing.category,
    screenshots: listing.screenshots,
    videoUrl: listing.videoUrl,
    featured: listing.featured,
    trending: listing.trending,
    editorsChoice: listing.editorsChoice,
    recommended: listing.recommended,
    verified: listing.verified,
    premium: listing.premium,
    price: listing.price,
    currency: listing.currency,
    ratingAverage: Math.round(listing.ratingAverage * 10) / 10,
    ratingCount: listing.ratingCount,
    downloadCount: listing.downloadCount,
    storageSize: listing.storageSize,
    permissions: listing.permissions,
    minOSVersion: listing.minOSVersion,
    tags: listing.tags,
    developer: developer
      ? {
          id: developer._id.toString(),
          name: developer.name,
          logo: developer.logo,
          verified: developer.verified,
        }
      : null,
  };
}

export const getFeatured = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const listings = await StoreListing.find({ featured: true })
    .sort({ trendingScore: -1 })
    .limit(10)
    .populate('appId');

  const apps = await Promise.all(
    listings.map((l) => formatStoreApp(l, l.appId as unknown as InstanceType<typeof App>))
  );

  res.json({ success: true, data: apps });
});

export const getTrending = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const listings = await StoreListing.find({ trending: true })
    .sort({ trendingScore: -1 })
    .limit(20)
    .populate('appId');

  const apps = await Promise.all(
    listings.map((l) => formatStoreApp(l, l.appId as unknown as InstanceType<typeof App>))
  );

  res.json({ success: true, data: apps });
});

export const getRecommended = asyncHandler(async (req: AuthRequest, res: Response) => {
  const listings = await StoreListing.find({ recommended: true })
    .sort({ ratingAverage: -1 })
    .limit(15)
    .populate('appId');

  const apps = await Promise.all(
    listings.map((l) => formatStoreApp(l, l.appId as unknown as InstanceType<typeof App>))
  );

  res.json({ success: true, data: apps });
});

export const getEditorsChoice = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const listings = await StoreListing.find({ editorsChoice: true })
    .sort({ downloadCount: -1 })
    .limit(10)
    .populate('appId');

  const apps = await Promise.all(
    listings.map((l) => formatStoreApp(l, l.appId as unknown as InstanceType<typeof App>))
  );

  res.json({ success: true, data: apps });
});

export const getCategories = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const counts = await StoreListing.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

  res.json({
    success: true,
    data: STORE_CATEGORIES.map((cat) => ({
      ...cat,
      count: countMap[cat.id] ?? 0,
    })),
  });
});

export const getByCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category } = req.params;
  const listings = await StoreListing.find({ category })
    .sort({ downloadCount: -1 })
    .populate('appId');

  const apps = await Promise.all(
    listings.map((l) => formatStoreApp(l, l.appId as unknown as InstanceType<typeof App>))
  );

  res.json({ success: true, data: apps });
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, sort = 'relevance' } = req.query;
  if (!q || typeof q !== 'string') {
    throw new AppError(400, 'Search query required');
  }

  let query = StoreListing.find({
    $or: [
      { tags: { $regex: q, $options: 'i' } },
      { tagline: { $regex: q, $options: 'i' } },
    ],
  }).populate('appId');

  const appMatches = await App.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ],
  }).select('_id');

  if (appMatches.length > 0) {
    query = StoreListing.find({
      $or: [
        { appId: { $in: appMatches.map((a) => a._id) } },
        { tags: { $regex: q, $options: 'i' } },
        { tagline: { $regex: q, $options: 'i' } },
      ],
    }).populate('appId');
  }

  if (sort === 'rating') query = query.sort({ ratingAverage: -1 });
  else if (sort === 'downloads') query = query.sort({ downloadCount: -1 });
  else query = query.sort({ trendingScore: -1 });

  const listings = await query.limit(30);
  const apps = await Promise.all(
    listings.map((l) => formatStoreApp(l, l.appId as unknown as InstanceType<typeof App>))
  );

  res.json({ success: true, data: apps });
});

export const getAppDetail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bundleId } = req.params;
  const listing = await StoreListing.findOne({ bundleId }).populate('appId');
  if (!listing) throw new AppError(404, 'App not found');

  const app = listing.appId as unknown as InstanceType<typeof App>;
  const versions = await AppVersion.find({ bundleId }).sort({ releaseDate: -1 });
  const reviews = await StoreReview.find({ bundleId })
    .sort({ createdAt: -1 })
    .limit(20);

  let installed = false;
  let installedVersion: string | null = null;
  if (req.user) {
    const inst = await InstalledApp.findOne({ userId: req.user.userId, bundleId });
    installed = !!inst;
    installedVersion = inst?.installedVersion ?? null;
  }

  const formatted = await formatStoreApp(listing, app);

  res.json({
    success: true,
    data: {
      ...formatted,
      installed,
      installedVersion,
      hasUpdate: installed && installedVersion !== app.version,
      versions: versions.map((v) => ({
        version: v.version,
        changelog: v.changelog,
        releaseDate: v.releaseDate.toISOString(),
        size: v.size,
      })),
      reviews: reviews.map((r) => ({
        id: r._id.toString(),
        username: r.username,
        rating: r.rating,
        title: r.title,
        body: r.body,
        helpful: r.helpful,
        createdAt: r.createdAt.toISOString(),
      })),
    },
  });
});

export const getReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bundleId } = req.params;
  const reviews = await StoreReview.find({ bundleId }).sort({ createdAt: -1 });
  res.json({
    success: true,
    data: reviews.map((r) => ({
      id: r._id.toString(),
      username: r.username,
      rating: r.rating,
      title: r.title,
      body: r.body,
      helpful: r.helpful,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

export const postReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bundleId } = req.params;
  const data = reviewSchema.parse(req.body);

  const listing = await StoreListing.findOne({ bundleId });
  if (!listing) throw new AppError(404, 'App not found');

  const review = await StoreReview.create({
    listingId: listing._id,
    bundleId,
    userId: req.user!.userId,
    username: req.user!.username,
    ...data,
  });

  const stats = await StoreReview.aggregate([
    { $match: { bundleId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats[0]) {
    await StoreListing.findByIdAndUpdate(listing._id, {
      ratingAverage: stats[0].avg,
      ratingCount: stats[0].count,
    });
  }

  res.status(201).json({
    success: true,
    data: {
      id: review._id.toString(),
      username: review.username,
      rating: review.rating,
      title: review.title,
      body: review.body,
      createdAt: review.createdAt.toISOString(),
    },
  });
});

export const installApp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bundleId } = req.params;
  const body = installBodySchema.parse(req.body ?? {});
  const listing = await StoreListing.findOne({ bundleId }).populate('appId');
  if (!listing) throw new AppError(404, 'App not found');

  const app = listing.appId as unknown as InstanceType<typeof App>;
  const existing = await InstalledApp.findOne({ userId: req.user!.userId, bundleId });
  if (existing) throw new AppError(409, 'App already installed');

  const required = listing.storageSize;
  const storageCheck = await checkAvailableStorage(req.user!.userId, required);
  if (!storageCheck.available) {
    res.status(507).json({
      success: false,
      error: 'INSUFFICIENT_STORAGE',
      message: 'Not enough storage.',
      data: {
        required,
        free: storageCheck.free,
        breakdown: storageCheck.breakdown,
      },
    });
    return;
  }

  const download = await StoreDownload.create({
    userId: req.user!.userId,
    bundleId,
    appName: app.name,
    appIcon: app.icon,
    type: 'install',
    status: 'queued',
    targetVersion: app.version,
    size: listing.storageSize,
    approvedPermissions: body.approvedPermissions ?? listing.permissions ?? [],
  });

  try {
    await prepareDownloadStorage(
      req.user!.userId,
      param(bundleId),
      app.version,
      download._id.toString()
    );
  } catch (err) {
    await StoreDownload.findByIdAndDelete(download._id);
    if (err instanceof Error && err.message === 'INSUFFICIENT_STORAGE') {
      throw new AppError(507, 'Not enough storage.');
    }
    throw err;
  }

  await enqueueDownload(download._id.toString(), req.user!.userId);

  res.status(202).json({
    success: true,
    data: {
      downloadId: download._id.toString(),
      bundleId,
      status: 'queued',
      message: 'Installation started',
    },
  });
});

export const completeInstall = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { downloadId } = req.params;
  const download = await StoreDownload.findOne({
    _id: downloadId,
    userId: req.user!.userId,
  });
  if (!download) throw new AppError(404, 'Download not found');

  const existing = await InstalledApp.findOne({
    userId: req.user!.userId,
    bundleId: download.bundleId,
  });
  if (existing) {
    res.json({
      success: true,
      data: {
        bundleId: existing.bundleId,
        installedVersion: existing.installedVersion,
        installedAt: existing.installedAt.toISOString(),
      },
    });
    return;
  }

  if (download.status !== 'completed') {
    throw new AppError(400, 'Download not completed');
  }

  const app = await App.findOne({ bundleId: download.bundleId });
  const listing = await StoreListing.findOne({ bundleId: download.bundleId });
  if (!app || !listing) throw new AppError(404, 'App not found');

  const installed = await InstalledApp.create({
    userId: req.user!.userId,
    appId: app._id,
    bundleId: download.bundleId,
    installedVersion: download.targetVersion,
    storageBytes: listing.storageSize,
  });

  res.json({
    success: true,
    data: {
      bundleId: installed.bundleId,
      installedVersion: installed.installedVersion,
      installedAt: installed.installedAt.toISOString(),
    },
  });
});

const uninstallBodySchema = z.object({
  keepData: z.boolean().optional(),
  keepUserData: z.boolean().optional(),
  keepSettings: z.boolean().optional(),
  keepSession: z.boolean().optional(),
});

export const uninstallApp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bundleId } = req.params;
  const body = uninstallBodySchema.parse(req.body ?? {});

  const installed = await InstalledApp.findOne({ userId: req.user!.userId, bundleId: param(bundleId) });
  if (!installed) throw new AppError(404, 'App not installed');

  await executeUninstall(req.user!.userId, param(bundleId), {
    keepUserData: body.keepUserData ?? body.keepData ?? false,
    keepSettings: body.keepSettings ?? false,
    keepSession: body.keepSession ?? false,
  });
  res.json({ success: true, message: 'App uninstalled' });
});

export const updateApp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bundleId } = req.params;
  const body = installBodySchema.parse(req.body ?? {});
  const installed = await InstalledApp.findOne({ userId: req.user!.userId, bundleId });
  if (!installed) throw new AppError(404, 'App not installed');

  const app = await App.findOne({ bundleId });
  const listing = await StoreListing.findOne({ bundleId });
  if (!app || !listing) throw new AppError(404, 'App not found');

  if (installed.installedVersion === app.version) {
    throw new AppError(400, 'App is already up to date');
  }

  const required = listing.storageSize;
  const storageCheck = await checkAvailableStorage(req.user!.userId, required);
  if (!storageCheck.available) {
    res.status(507).json({
      success: false,
      error: 'INSUFFICIENT_STORAGE',
      message: 'Not enough storage.',
      data: { required, free: storageCheck.free, breakdown: storageCheck.breakdown },
    });
    return;
  }

  const download = await StoreDownload.create({
    userId: req.user!.userId,
    bundleId,
    appName: app.name,
    appIcon: app.icon,
    type: 'update',
    status: 'queued',
    version: installed.installedVersion,
    targetVersion: app.version,
    size: listing.storageSize,
    approvedPermissions: body.approvedPermissions ?? listing.permissions ?? [],
    previousVersion: installed.installedVersion,
  });

  try {
    await prepareDownloadStorage(
      req.user!.userId,
      param(bundleId),
      app.version,
      download._id.toString()
    );
  } catch (err) {
    await StoreDownload.findByIdAndDelete(download._id);
    if (err instanceof Error && err.message === 'INSUFFICIENT_STORAGE') {
      throw new AppError(507, 'Not enough storage.');
    }
    throw err;
  }

  await enqueueDownload(download._id.toString(), req.user!.userId);

  res.status(202).json({
    success: true,
    data: { downloadId: download._id.toString(), status: 'queued' },
  });
});

export const completeUpdate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { downloadId } = req.params;
  const download = await StoreDownload.findOne({
    _id: downloadId,
    userId: req.user!.userId,
    type: 'update',
  });
  if (!download) throw new AppError(404, 'Update not found');

  const installed = await InstalledApp.findOne({
    userId: req.user!.userId,
    bundleId: download.bundleId,
  });
  if (installed?.installedVersion === download.targetVersion) {
    res.json({ success: true, message: 'App already updated' });
    return;
  }

  if (download.status !== 'completed') {
    throw new AppError(400, 'Update not completed');
  }

  await InstalledApp.findOneAndUpdate(
    { userId: req.user!.userId, bundleId: download.bundleId },
    { installedVersion: download.targetVersion, updatedAt: new Date() }
  );

  res.json({ success: true, message: 'App updated' });
});

export const getInstalled = asyncHandler(async (req: AuthRequest, res: Response) => {
  const installed = await InstalledApp.find({ userId: req.user!.userId }).populate('appId');
  const registry = await getUserRegistry(req.user!.userId);

  const data = await Promise.all(
    installed.map(async (item) => {
      const app = item.appId as unknown as InstanceType<typeof App>;
      const listing = await StoreListing.findOne({ bundleId: item.bundleId });
      const registryEntry = registry.find((r) => r.bundleId === item.bundleId);
      const hasUpdate = app.version !== item.installedVersion;
      return {
        bundleId: item.bundleId,
        name: app.name,
        icon: app.icon,
        installedVersion: item.installedVersion,
        latestVersion: app.version,
        hasUpdate,
        storageBytes: item.storageBytes,
        installedAt: item.installedAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        lastUsedAt: item.lastUsedAt.toISOString(),
        isSystemApp: app.isSystemApp,
        permissions: listing?.permissions ?? app.permissions,
        state: registryEntry?.state ?? 'installed',
      };
    })
  );

  res.json({ success: true, data, registry });
});

export const getDownloads = asyncHandler(async (req: AuthRequest, res: Response) => {
  const downloads = await StoreDownload.find({ userId: req.user!.userId })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    data: downloads.map((d) => ({
      id: d._id.toString(),
      bundleId: d.bundleId,
      appName: d.appName,
      appIcon: d.appIcon,
      type: d.type,
      status: d.status,
      progress: d.progress,
      version: d.version,
      targetVersion: d.targetVersion,
      size: d.size,
      downloadedBytes: d.downloadedBytes,
      downloadSpeed: d.downloadSpeed,
      etaSeconds: d.etaSeconds,
      queuePosition: d.queuePosition,
      installStep: d.installStep,
      error: d.error,
      startedAt: d.startedAt.toISOString(),
      completedAt: d.completedAt?.toISOString(),
    })),
  });
});

export const getUpdates = asyncHandler(async (req: AuthRequest, res: Response) => {
  const updates = await checkForUpdates(req.user!.userId);
  res.json({ success: true, data: updates });
});

export const getDeveloper = asyncHandler(async (req: AuthRequest, res: Response) => {
  const developer = await Developer.findOne({ slug: req.params.slug });
  if (!developer) throw new AppError(404, 'Developer not found');

  const listings = await StoreListing.find({ developerId: developer._id }).populate('appId');
  const apps = await Promise.all(
    listings.map((l) => formatStoreApp(l, l.appId as unknown as InstanceType<typeof App>))
  );

  res.json({
    success: true,
    data: {
      id: developer._id.toString(),
      slug: developer.slug,
      name: developer.name,
      description: developer.description,
      logo: developer.logo,
      website: developer.website,
      verified: developer.verified,
      appCount: developer.appCount,
      apps,
    },
  });
});

export const getStoreSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  let settings = await UserStoreSettings.findOne({ userId: req.user!.userId });
  if (!settings) {
    settings = await UserStoreSettings.create({ userId: req.user!.userId });
  }
  res.json({
    success: true,
    data: {
      autoUpdate: settings.autoUpdate,
      cellularDownloads: settings.cellularDownloads,
      notifyUpdates: settings.notifyUpdates,
    },
  });
});

export const updateStoreSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await UserStoreSettings.findOneAndUpdate(
    { userId: req.user!.userId },
    { $set: req.body },
    { new: true, upsert: true }
  );
  res.json({
    success: true,
    data: {
      autoUpdate: settings.autoUpdate,
      cellularDownloads: settings.cellularDownloads,
      notifyUpdates: settings.notifyUpdates,
    },
  });
});

export const getRecentlyInstalled = asyncHandler(async (req: AuthRequest, res: Response) => {
  const installed = await InstalledApp.find({ userId: req.user!.userId })
    .sort({ installedAt: -1 })
    .limit(10)
    .populate('appId');

  const data = installed.map((item) => {
    const app = item.appId as unknown as InstanceType<typeof App>;
    return {
      bundleId: item.bundleId,
      name: app.name,
      icon: app.icon,
      installedAt: item.installedAt.toISOString(),
    };
  });

  res.json({ success: true, data });
});

export const seedStore = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const { seedGulfStore } = await import('../../services/storeSeedService');
  const result = await seedGulfStore();
  res.json({ success: true, data: result });
});

export const getPackageManifestHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bundleId } = req.params;
  const version = req.query.version as string | undefined;
  const app = await App.findOne({ bundleId });
  if (!app) throw new AppError(404, 'App not found');

  const manifest = await getPackageManifest(param(bundleId), version ?? app.version);
  const storageRequired = await getStorageRequired(param(bundleId), version ?? app.version);
  res.json({ success: true, data: { manifest, storageRequired } });
});

export const pauseDownloadHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await pauseDownload(param(req.params.downloadId), req.user!.userId);
  res.json({ success: true });
});

export const resumeDownloadHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await resumeDownload(param(req.params.downloadId), req.user!.userId);
  res.json({ success: true });
});

export const cancelDownloadHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await cancelDownload(param(req.params.downloadId), req.user!.userId);
  res.json({ success: true });
});

export const retryDownloadHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await retryDownload(param(req.params.downloadId), req.user!.userId);
  res.json({ success: true });
});

export const getQueueHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const queue = await getDownloadQueue(req.user!.userId);
  res.json({ success: true, data: queue });
});

export const getAppStorageHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const storage = await getAppStorage(req.user!.userId, param(req.params.bundleId));
  res.json({ success: true, data: storage });
});

export const clearCacheHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const storage = await clearAppCache(req.user!.userId, param(req.params.bundleId));
  res.json({ success: true, data: storage });
});

export const clearDataHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const storage = await clearAppData(req.user!.userId, param(req.params.bundleId));
  res.json({ success: true, data: storage });
});

export const getRegistryHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const registry = await getUserRegistry(req.user!.userId);
  res.json({ success: true, data: registry });
});

export const getRegistryEntryHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const entry = await getRegistryEntry(req.user!.userId, param(req.params.bundleId));
  if (!entry) throw new AppError(404, 'App not registered');
  res.json({ success: true, data: entry });
});

export const getChangelogHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const bundleId = param(req.params.bundleId);
  const fromVersion = req.query.from as string;
  const toVersion = req.query.to as string;
  if (!fromVersion || !toVersion) throw new AppError(400, 'from and to version required');
  const changelog = await getChangelog(bundleId, fromVersion, toVersion);
  res.json({ success: true, data: { changelog } });
});

export const startUpdateHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = installBodySchema.parse(req.body ?? {});
  const bundleId = param(req.params.bundleId);
  const listing = await StoreListing.findOne({ bundleId });
  const result = await startUpdate(
    req.user!.userId,
    bundleId,
    body.approvedPermissions ?? listing?.permissions ?? []
  );
  res.json({ success: true, data: result });
});

const autoUpdateSchema = z.object({ enabled: z.boolean() });

export const setAutoUpdateHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = autoUpdateSchema.parse(req.body);
  const data = await setAutoUpdate(req.user!.userId, param(req.params.bundleId), body.enabled);
  res.json({ success: true, data });
});
