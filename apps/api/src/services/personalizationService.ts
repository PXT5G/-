import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import {
  ThemeProfile, WallpaperPack, HomeLayout, LockScreenProfile,
  ContinuitySession, ClipboardSession, type IHomeLayout,
} from '../database/models/Personalization';
import { PERSONALIZATION_APP_BUNDLE } from '../constants/personalization';
import { checkPermission } from './permissionBrokerService';
import { emitToUser } from './socketService';
import { logAudit } from './auditService';

function id(prefix: string) { return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`; }

async function assertAccess(userId: string) {
  const allowed = await checkPermission(userId, PERSONALIZATION_APP_BUNDLE, 'notifications');
  if (!allowed) throw new Error('PERSONALIZATION_PERMISSION_DENIED');
}

export async function initializePersonalization(userId: string, actorId: string) {
  await assertAccess(userId);
  const oid = new Types.ObjectId(userId);
  const themeExists = await ThemeProfile.findOne({ userId: oid, deletedAt: null });
  if (!themeExists) {
    await ThemeProfile.create({
      profileId: id('THM'), userId: oid, name: 'GULF Dark', mode: 'dark',
      accentColor: '#D4AF37', isActive: true, createdBy: new Types.ObjectId(actorId),
    });
    await WallpaperPack.create({
      packId: id('WLP'), userId: oid, name: 'GULF Gradient', type: 'gradient',
      wallpapers: [{ id: 'default', gradient: 'linear-gradient(180deg, #0a1628 0%, #1a1a2e 100%)' }],
      isActive: true, createdBy: new Types.ObjectId(actorId),
    });
    await HomeLayout.create({
      layoutId: id('HML'), userId: oid, name: 'Default Home', pages: [{ pageIndex: 0, apps: [] }],
      isActive: true, createdBy: new Types.ObjectId(actorId),
    });
    await LockScreenProfile.create({
      profileId: id('LSP'), userId: oid, name: 'Default Lock', isActive: true,
      createdBy: new Types.ObjectId(actorId),
    });
  }
  return { initialized: true };
}

export async function getThemes(userId: string) {
  await assertAccess(userId);
  return ThemeProfile.find({ userId: new Types.ObjectId(userId), deletedAt: null });
}

export async function activateTheme(userId: string, profileId: string, actorId: string) {
  await assertAccess(userId);
  const oid = new Types.ObjectId(userId);
  await ThemeProfile.updateMany({ userId: oid }, { isActive: false });
  const theme = await ThemeProfile.findOneAndUpdate(
    { profileId, userId: oid }, { isActive: true }, { new: true }
  );
  if (!theme) throw new Error('THEME_NOT_FOUND');
  emitToUser(userId, 'theme:update', { profileId, mode: theme.mode, accentColor: theme.accentColor });
  return theme;
}

export async function getWallpaperPacks(userId: string) {
  await assertAccess(userId);
  return WallpaperPack.find({ userId: new Types.ObjectId(userId), deletedAt: null });
}

export async function getHomeLayouts(userId: string) {
  await assertAccess(userId);
  return HomeLayout.find({ userId: new Types.ObjectId(userId), deletedAt: null });
}

export async function updateHomeLayout(userId: string, layoutId: string, input: Partial<{
  pages: IHomeLayout['pages']; dockApps: string[]; hiddenApps: string[]; iconSize: string;
}>, _actorId: string) {
  await assertAccess(userId);
  const layout = await HomeLayout.findOne({ layoutId, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!layout) throw new Error('LAYOUT_NOT_FOUND');
  if (input.pages) layout.pages = input.pages;
  if (input.dockApps) layout.dockApps = input.dockApps;
  if (input.hiddenApps) layout.hiddenApps = input.hiddenApps;
  if (input.iconSize) layout.iconSize = input.iconSize as never;
  await layout.save();
  emitToUser(userId, 'layout:update', { layoutId });
  return layout;
}

export async function getLockScreenProfiles(userId: string) {
  await assertAccess(userId);
  return LockScreenProfile.find({ userId: new Types.ObjectId(userId), deletedAt: null });
}

export async function activateLockScreenProfile(userId: string, profileId: string, actorId: string) {
  await assertAccess(userId);
  const oid = new Types.ObjectId(userId);
  await LockScreenProfile.updateMany({ userId: oid }, { isActive: false });
  const profile = await LockScreenProfile.findOneAndUpdate(
    { profileId, userId: oid }, { isActive: true }, { new: true }
  );
  if (!profile) throw new Error('LOCK_SCREEN_PROFILE_NOT_FOUND');
  emitToUser(userId, 'wallpaper:update', { profileId });
  return profile;
}

export async function startHandoff(userId: string, sourceDeviceId: string, type: string, payload: Record<string, unknown>) {
  await assertAccess(userId);
  const session = await ContinuitySession.create({
    sessionId: id('HND'),
    userId: new Types.ObjectId(userId),
    sourceDeviceId,
    type: type as never,
    payload,
    status: 'active',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });
  emitToUser(userId, 'handoff:start', { sessionId: session.sessionId, type, payload });
  return { sessionId: session.sessionId, type, status: 'active' };
}

export async function syncClipboard(userId: string, sourceDeviceId: string, content: string, contentType = 'text') {
  await assertAccess(userId);
  const session = await ClipboardSession.create({
    sessionId: id('CLP'),
    userId: new Types.ObjectId(userId),
    content,
    contentType: contentType as never,
    sourceDeviceId,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  emitToUser(userId, 'clipboard:update', { sessionId: session.sessionId, contentType });
  return { sessionId: session.sessionId, synced: true };
}

export async function getClipboard(userId: string) {
  await assertAccess(userId);
  const clip = await ClipboardSession.findOne({
    userId: new Types.ObjectId(userId),
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
  return clip ? { content: clip.content, contentType: clip.contentType, sourceDeviceId: clip.sourceDeviceId } : null;
}

export async function getPerformanceSnapshot(userId: string) {
  const { refreshPerformanceState, getDeviceDiagnostics } = await import('./phoneOsService');
  const { getDeviceState } = await import('./deviceStateService');
  const [perf, device, diagnostics] = await Promise.all([
    refreshPerformanceState(userId).catch(() => null),
    getDeviceState(userId).catch(() => null),
    getDeviceDiagnostics(userId).catch(() => null),
  ]);
  emitToUser(userId, 'performance:update', { perf, device });
  return { performance: perf, device, diagnostics };
}

export { PERSONALIZATION_APP_BUNDLE };
