import { Types } from 'mongoose';
import { ControlCenterConfig } from '../database/models/ControlCenterConfig';
import { LockScreenConfig } from '../database/models/LockScreenConfig';
import { StatusBarConfig } from '../database/models/StatusBarConfig';
import { WallpaperConfigModel } from '../database/models/WallpaperConfig';
import { WidgetLayout } from '../database/models/WidgetLayout';
import { NotificationPreferences } from '../database/models/NotificationPreferences';
import { AccessibilityConfig } from '../database/models/AccessibilityConfig';
import { emitToUser } from './socketService';

function formatControlCenter(doc: InstanceType<typeof ControlCenterConfig>) {
  return {
    tiles: doc.tiles,
    longPressActions: doc.longPressActions,
    showBatteryWidget: doc.showBatteryWidget,
    showNetworkDetails: doc.showNetworkDetails,
    showMusicControls: doc.showMusicControls,
    showMediaOutput: doc.showMediaOutput,
    brightnessEnabled: doc.brightnessEnabled,
    volumeEnabled: doc.volumeEnabled,
    focusModeEnabled: doc.focusModeEnabled,
    activeFocusMode: doc.activeFocusMode,
  };
}

function formatLockScreen(doc: InstanceType<typeof LockScreenConfig>) {
  return {
    clockStyle: doc.clockStyle,
    wallpaperBlur: doc.wallpaperBlur,
    showWidgets: doc.showWidgets,
    showNotifications: doc.showNotifications,
    showMusicPlayer: doc.showMusicPlayer,
    showChargingIndicator: doc.showChargingIndicator,
    emergencyCallEnabled: doc.emergencyCallEnabled,
    cameraShortcutEnabled: doc.cameraShortcutEnabled,
    flashlightShortcutEnabled: doc.flashlightShortcutEnabled,
    faceUnlockEnabled: doc.faceUnlockEnabled,
    fingerprintEnabled: doc.fingerprintEnabled,
    pinEnabled: doc.pinEnabled,
    passcodeEnabled: doc.passcodeEnabled,
    autoLockSeconds: doc.autoLockSeconds,
    raiseToWake: doc.raiseToWake,
    doubleTapToWake: doc.doubleTapToWake,
    alwaysOnDisplay: doc.alwaysOnDisplay,
  };
}

function formatStatusBar(doc: InstanceType<typeof StatusBarConfig>) {
  return {
    visibleIcons: doc.visibleIcons,
    showCarrier: doc.showCarrier,
    showClock: doc.showClock,
    showBatteryPercent: doc.showBatteryPercent,
    showVpn: doc.showVpn,
    showDnd: doc.showDnd,
    showAlarm: doc.showAlarm,
    showGps: doc.showGps,
    showHotspot: doc.showHotspot,
    showEmergency: doc.showEmergency,
  };
}

function formatWallpaper(doc: InstanceType<typeof WallpaperConfigModel>) {
  return {
    wallpaperId: doc.wallpaperId,
    type: doc.type,
    lightUrl: doc.lightUrl,
    darkUrl: doc.darkUrl,
    url: doc.url,
    animatedClass: doc.animatedClass,
    motionEnabled: doc.motionEnabled,
    blurLayers: doc.blurLayers,
    parallaxEnabled: doc.parallaxEnabled,
  };
}

function formatWidgetLayout(doc: InstanceType<typeof WidgetLayout>) {
  return {
    pages: doc.pages,
    dockApps: doc.dockApps,
    hiddenApps: doc.hiddenApps,
    gridColumns: doc.gridColumns,
    gridRows: doc.gridRows,
  };
}

function formatNotificationPrefs(doc: InstanceType<typeof NotificationPreferences>) {
  return {
    groupMode: doc.groupMode,
    showPreviews: doc.showPreviews,
    showOnLockScreen: doc.showOnLockScreen,
    showInHistory: doc.showInHistory,
    showSummaries: doc.showSummaries,
    allowCritical: doc.allowCritical,
    allowSilent: doc.allowSilent,
    allowScheduled: doc.allowScheduled,
    allowPersistent: doc.allowPersistent,
    allowInlineReplies: doc.allowInlineReplies,
    allowActionButtons: doc.allowActionButtons,
    perAppSettings: doc.perAppSettings,
  };
}

function formatAccessibility(doc: InstanceType<typeof AccessibilityConfig>) {
  return {
    voiceOverEnabled: doc.voiceOverEnabled,
    largeText: doc.largeText,
    boldText: doc.boldText,
    reduceMotion: doc.reduceMotion,
    reduceTransparency: doc.reduceTransparency,
    monoAudio: doc.monoAudio,
    captionsEnabled: doc.captionsEnabled,
    colorFiltersEnabled: doc.colorFiltersEnabled,
    colorFilterType: doc.colorFilterType,
    touchAssistEnabled: doc.touchAssistEnabled,
    hearingAidEnabled: doc.hearingAidEnabled,
    fontScale: doc.fontScale,
  };
}

async function ensureControlCenter(userId: string) {
  let doc = await ControlCenterConfig.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) doc = await ControlCenterConfig.create({ userId: new Types.ObjectId(userId) });
  return doc;
}

async function ensureLockScreen(userId: string) {
  let doc = await LockScreenConfig.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) doc = await LockScreenConfig.create({ userId: new Types.ObjectId(userId) });
  return doc;
}

async function ensureStatusBar(userId: string) {
  let doc = await StatusBarConfig.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) doc = await StatusBarConfig.create({ userId: new Types.ObjectId(userId) });
  return doc;
}

async function ensureWallpaper(userId: string) {
  let doc = await WallpaperConfigModel.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) doc = await WallpaperConfigModel.create({ userId: new Types.ObjectId(userId) });
  return doc;
}

async function ensureWidgetLayout(userId: string) {
  let doc = await WidgetLayout.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) doc = await WidgetLayout.create({ userId: new Types.ObjectId(userId) });
  return doc;
}

async function ensureNotificationPrefs(userId: string) {
  let doc = await NotificationPreferences.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) doc = await NotificationPreferences.create({ userId: new Types.ObjectId(userId) });
  return doc;
}

async function ensureAccessibility(userId: string) {
  let doc = await AccessibilityConfig.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) doc = await AccessibilityConfig.create({ userId: new Types.ObjectId(userId) });
  return doc;
}

export async function initializePhoneOsConfigs(userId: string) {
  const [controlCenter, lockScreen, statusBar, wallpaper, widgetLayout, notificationPrefs, accessibility] =
    await Promise.all([
      ensureControlCenter(userId),
      ensureLockScreen(userId),
      ensureStatusBar(userId),
      ensureWallpaper(userId),
      ensureWidgetLayout(userId),
      ensureNotificationPrefs(userId),
      ensureAccessibility(userId),
    ]);

  return {
    controlCenter: formatControlCenter(controlCenter),
    lockScreen: formatLockScreen(lockScreen),
    statusBar: formatStatusBar(statusBar),
    wallpaper: formatWallpaper(wallpaper),
    widgetLayout: formatWidgetLayout(widgetLayout),
    notificationPreferences: formatNotificationPrefs(notificationPrefs),
    accessibility: formatAccessibility(accessibility),
  };
}

export async function getPhoneOsConfigs(userId: string) {
  return initializePhoneOsConfigs(userId);
}

export async function updateControlCenterConfig(
  userId: string,
  updates: Partial<ReturnType<typeof formatControlCenter>>,
  actorId: string
) {
  const doc = await ensureControlCenter(userId);
  Object.assign(doc, updates);
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();
  const data = formatControlCenter(doc);
  emitToUser(userId, 'control:center:update', data);
  return data;
}

export async function updateLockScreenConfig(
  userId: string,
  updates: Partial<ReturnType<typeof formatLockScreen>>,
  actorId: string
) {
  const doc = await ensureLockScreen(userId);
  Object.assign(doc, updates);
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();
  emitToUser(userId, 'device:lock', { config: formatLockScreen(doc) });
  return formatLockScreen(doc);
}

export async function updateStatusBarConfig(
  userId: string,
  updates: Partial<ReturnType<typeof formatStatusBar>>,
  actorId: string
) {
  const doc = await ensureStatusBar(userId);
  Object.assign(doc, updates);
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();
  const data = formatStatusBar(doc);
  emitToUser(userId, 'status:update', data);
  return data;
}

export async function updateWallpaperConfig(
  userId: string,
  updates: Partial<ReturnType<typeof formatWallpaper>>,
  actorId: string
) {
  const doc = await ensureWallpaper(userId);
  Object.assign(doc, updates);
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();
  emitToUser(userId, 'widget:update', { wallpaper: formatWallpaper(doc) });
  return formatWallpaper(doc);
}

export async function updateWidgetLayout(
  userId: string,
  updates: Partial<ReturnType<typeof formatWidgetLayout>>,
  actorId: string
) {
  const doc = await ensureWidgetLayout(userId);
  Object.assign(doc, updates);
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();
  const data = formatWidgetLayout(doc);
  emitToUser(userId, 'widget:update', data);
  return data;
}

export async function updateNotificationPreferences(
  userId: string,
  updates: Partial<ReturnType<typeof formatNotificationPrefs>>,
  actorId: string
) {
  const doc = await ensureNotificationPrefs(userId);
  Object.assign(doc, updates);
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();
  return formatNotificationPrefs(doc);
}

export async function updateAccessibilityConfig(
  userId: string,
  updates: Partial<ReturnType<typeof formatAccessibility>>,
  actorId: string
) {
  const doc = await ensureAccessibility(userId);
  Object.assign(doc, updates);
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();
  return formatAccessibility(doc);
}
