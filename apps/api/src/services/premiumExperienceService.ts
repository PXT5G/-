import { Types } from 'mongoose';
import { PremiumExperienceProfile } from '../database/models/PremiumExperienceProfile';
import { NotificationHistoryEntry } from '../database/models/NotificationHistoryEntry';
import { InstalledPackage } from '../database/models/InstalledPackage';
import { APP_LIBRARY_CATEGORIES } from '../constants/premiumExperience';
import { logAudit } from './auditService';
import { emitToUser } from './socketService';
import { seedWidgetRegistry } from './widgetEngineService';

function formatProfile(doc: InstanceType<typeof PremiumExperienceProfile>) {
  return {
    lockScreenLayout: doc.lockScreenLayout,
    clockFont: doc.clockFont,
    clockColor: doc.clockColor,
    wallpaperCollection: doc.wallpaperCollection,
    liveWallpaper: doc.liveWallpaper,
    depthWallpaper: doc.depthWallpaper,
    lockScreenWidgets: doc.lockScreenWidgets,
    quickNotes: doc.quickNotes,
    smartSuggestions: doc.smartSuggestions,
    chargingAnimation: doc.chargingAnimation,
    unlockAnimation: doc.unlockAnimation,
    homeBlurIntensity: doc.homeBlurIntensity,
    unlimitedPages: doc.unlimitedPages,
    smartFolders: doc.smartFolders,
    hiddenPageIndexes: doc.hiddenPageIndexes,
    iconPackId: doc.iconPackId,
    iconSize: doc.iconSize,
    dockApps: doc.dockApps,
    hiddenApps: doc.hiddenApps,
    multitaskingMode: doc.multitaskingMode,
    pinnedApps: doc.pinnedApps,
    lockedApps: doc.lockedApps,
    dynamicIslandMaxActivities: doc.dynamicIslandMaxActivities,
    dynamicIslandEnabledTypes: doc.dynamicIslandEnabledTypes,
    notificationGroupStrategy: doc.notificationGroupStrategy,
    pinnedNotificationIds: doc.pinnedNotificationIds,
    notificationHistoryEnabled: doc.notificationHistoryEnabled,
    controlCenterPages: doc.controlCenterPages,
    controlCenterControls: doc.controlCenterControls,
    controlCenterPageIndex: doc.controlCenterPageIndex,
    appLibrarySuggestions: doc.appLibrarySuggestions,
    appLibraryAiRecommendations: doc.appLibraryAiRecommendations,
    reduceMotionOverride: doc.reduceMotionOverride,
    blurIntensity: doc.blurIntensity,
    parallaxEnabled: doc.parallaxEnabled,
    animationScale: doc.animationScale,
    lastUsedApps: doc.lastUsedApps.map((a) => ({
      bundleId: a.bundleId,
      usedAt: a.usedAt.toISOString(),
      count: a.count,
    })),
  };
}

async function ensureProfile(userId: string) {
  let doc = await PremiumExperienceProfile.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) {
    doc = await PremiumExperienceProfile.create({ userId: new Types.ObjectId(userId) });
  }
  return doc;
}

export async function initializePremiumExperience(userId: string, actorId: string) {
  const profile = await ensureProfile(userId);
  await seedWidgetRegistry();

  await logAudit({
    userId,
    actorId,
    action: 'premium_experience_initialize',
    resource: 'premium_experience',
  });

  const data = formatProfile(profile);
  emitToUser(userId, 'premium:ready', data);
  return data;
}

export async function getPremiumExperience(userId: string) {
  const profile = await ensureProfile(userId);
  return formatProfile(profile);
}

export async function updatePremiumExperience(
  userId: string,
  updates: Partial<ReturnType<typeof formatProfile>>,
  actorId: string
) {
  const doc = await ensureProfile(userId);
  Object.assign(doc, updates);
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();

  const data = formatProfile(doc);
  emitToUser(userId, 'premium:update', data);

  await logAudit({
    userId,
    actorId,
    action: 'premium_experience_update',
    resource: 'premium_experience',
    metadata: { keys: Object.keys(updates) },
  });

  return data;
}

export async function trackAppUsage(userId: string, bundleId: string) {
  const doc = await ensureProfile(userId);
  const existing = doc.lastUsedApps.find((a) => a.bundleId === bundleId);
  if (existing) {
    existing.usedAt = new Date();
    existing.count += 1;
  } else {
    doc.lastUsedApps.unshift({ bundleId, usedAt: new Date(), count: 1 });
  }
  doc.lastUsedApps = doc.lastUsedApps.slice(0, 50);
  await doc.save();
  return formatProfile(doc);
}

export async function addQuickNote(userId: string, note: string, actorId: string) {
  const doc = await ensureProfile(userId);
  doc.quickNotes = [note, ...doc.quickNotes].slice(0, 10);
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();
  emitToUser(userId, 'premium:update', { quickNotes: doc.quickNotes });
  return doc.quickNotes;
}

export async function recordNotificationHistory(
  userId: string,
  entry: {
    notificationId: string;
    appId: string;
    title: string;
    body: string;
    icon?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    groupId?: string;
    category?: string;
    pinned?: boolean;
    silent?: boolean;
    actions?: { id: string; label: string }[];
    metadata?: Record<string, unknown>;
  }
) {
  const profile = await ensureProfile(userId);
  if (!profile.notificationHistoryEnabled) return null;

  const doc = await NotificationHistoryEntry.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), notificationId: entry.notificationId },
    {
      userId: new Types.ObjectId(userId),
      ...entry,
      deliveredAt: new Date(),
      deletedAt: null,
    },
    { upsert: true, new: true }
  );

  emitToUser(userId, 'notification:history', {
    id: doc.notificationId,
    title: doc.title,
    deliveredAt: doc.deliveredAt.toISOString(),
  });

  return doc;
}

export async function getNotificationHistory(userId: string, limit = 100) {
  const entries = await NotificationHistoryEntry.find({
    userId: new Types.ObjectId(userId),
    deletedAt: null,
  })
    .sort({ deliveredAt: -1 })
    .limit(limit);

  return entries.map((e) => ({
    id: e.notificationId,
    appId: e.appId,
    title: e.title,
    body: e.body,
    icon: e.icon,
    priority: e.priority,
    groupId: e.groupId,
    category: e.category,
    pinned: e.pinned,
    silent: e.silent,
    deliveredAt: e.deliveredAt.toISOString(),
    readAt: e.readAt?.toISOString(),
    dismissedAt: e.dismissedAt?.toISOString(),
    actions: e.actions,
  }));
}

export async function pinNotification(userId: string, notificationId: string, pinned: boolean, actorId: string) {
  const profile = await ensureProfile(userId);
  if (pinned) {
    if (!profile.pinnedNotificationIds.includes(notificationId)) {
      profile.pinnedNotificationIds.push(notificationId);
    }
  } else {
    profile.pinnedNotificationIds = profile.pinnedNotificationIds.filter((id) => id !== notificationId);
  }
  profile.updatedBy = new Types.ObjectId(actorId);
  await profile.save();

  await NotificationHistoryEntry.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), notificationId },
    { pinned }
  );

  return profile.pinnedNotificationIds;
}

export async function getAppLibrary(userId: string) {
  const profile = await ensureProfile(userId);
  const packages = await InstalledPackage.find({ userId: new Types.ObjectId(userId) }).lean();

  const categorized: Record<string, typeof packages> = {};
  for (const cat of APP_LIBRARY_CATEGORIES) {
    categorized[cat] = [];
  }

  for (const pkg of packages) {
    const cat = categorizeApp(pkg.bundleId);
    categorized[cat].push(pkg);
  }

  const mostUsed = [...profile.lastUsedApps]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map((a) => {
      const pkg = packages.find((p) => p.bundleId === a.bundleId);
      return pkg ? { bundleId: pkg.bundleId, name: pkg.bundleId, developer: pkg.developer, count: a.count } : null;
    })
    .filter(Boolean);

  const recentlyAdded = [...packages]
    .sort((a, b) => new Date(b.installDate).getTime() - new Date(a.installDate).getTime())
    .slice(0, 12)
    .map((p) => ({ bundleId: p.bundleId, name: p.bundleId, developer: p.developer, installedAt: p.installDate.toISOString() }));

  const suggestions = profile.appLibrarySuggestions
    ? mostUsed.slice(0, 6)
    : [];

  const recommendations = profile.appLibraryAiRecommendations
    ? packages
        .filter((p) => !profile.hiddenApps.includes(p.bundleId))
        .filter((p) => !profile.lastUsedApps.some((u) => u.bundleId === p.bundleId))
        .slice(0, 6)
        .map((p) => ({ bundleId: p.bundleId, name: p.bundleId, reason: 'Recommended for you' }))
    : [];

  const visible = packages.filter((p) => !profile.hiddenApps.includes(p.bundleId));

  return {
    categories: categorized,
    mostUsed,
    recentlyAdded,
    suggestions,
    recommendations,
    hiddenApps: profile.hiddenApps,
    alphabetical: [...visible]
      .sort((a, b) => a.bundleId.localeCompare(b.bundleId))
      .map((p) => ({ bundleId: p.bundleId, developer: p.developer })),
    totalApps: packages.length,
  };
}

function categorizeApp(bundleId: string): string {
  if (bundleId.includes('business')) return 'business';
  if (bundleId.includes('bank') || bundleId.includes('exchange')) return 'finance';
  if (bundleId.includes('chat') || bundleId.includes('communication')) return 'social';
  if (bundleId.includes('police') || bundleId.includes('justice') || bundleId.includes('ems')) return 'government';
  if (bundleId.includes('store') || bundleId.includes('auto') || bundleId.includes('marine') || bundleId.includes('aviation') || bundleId.includes('realestate')) return 'shopping';
  if (bundleId.includes('maps') || bundleId.includes('weather')) return 'travel';
  if (bundleId.includes('browser') || bundleId.includes('poetry')) return 'news';
  if (bundleId.includes('game')) return 'games';
  if (bundleId.includes('settings') || bundleId.includes('files') || bundleId.includes('camera') || bundleId.includes('gallery')) return 'utilities';
  return 'other';
}
