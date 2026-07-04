import { Types } from 'mongoose';
import { AppRegistry, IAppRegistry } from '../database/models/AppRegistry';
import { App } from '../database/models/App';
import { RUNTIME_APPS } from './packageService';
import type { PackageManifest } from './packageService';

const REALTIME_EVENTS_BY_CATEGORY: Record<string, string[]> = {
  communication: ['app:notification', 'app:message'],
  finance: ['app:transaction', 'app:notification'],
  social: ['app:notification', 'app:activity'],
  system: ['app:notification'],
  utilities: ['app:notification'],
  productivity: ['app:notification'],
  media: ['app:notification', 'app:media'],
};

export async function registerApp(
  userId: string,
  manifest: PackageManifest,
  storagePath: string,
  approvedPermissions: string[]
): Promise<IAppRegistry> {
  const app = await App.findOne({ bundleId: manifest.bundleId });
  if (!app) throw new Error('App not found');

  const entry = await AppRegistry.findOneAndUpdate(
    { userId, bundleId: manifest.bundleId },
    {
      userId: new Types.ObjectId(userId),
      bundleId: manifest.bundleId,
      appId: app._id,
      name: app.name,
      icon: app.icon,
      version: manifest.version,
      state: 'installed',
      route: manifest.route ?? app.route,
      entryPoint: manifest.entryPoint ?? app.entryPoint,
      category: app.category,
      permissions: approvedPermissions,
      notifications: approvedPermissions.includes('notifications'),
      backgroundService: manifest.backgroundActivity,
      realtimeEvents: REALTIME_EVENTS_BY_CATEGORY[app.category] ?? ['app:notification'],
      storagePath,
      isSystemApp: app.isSystemApp,
      hasRuntime: manifest.hasRuntime ?? RUNTIME_APPS.has(manifest.bundleId),
      installedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return entry;
}

export async function unregisterApp(userId: string, bundleId: string): Promise<void> {
  await AppRegistry.deleteOne({ userId, bundleId });
}

export async function setAppState(
  userId: string,
  bundleId: string,
  state: IAppRegistry['state']
): Promise<void> {
  await AppRegistry.findOneAndUpdate({ userId, bundleId }, { state });
}

export async function listRegistry(userId: string) {
  const entries = await AppRegistry.find({ userId }).sort({ name: 1 });
  return entries.map((e) => ({
    bundleId: e.bundleId,
    name: e.name,
    icon: e.icon,
    version: e.version,
    state: e.state,
    category: e.category,
    permissions: e.permissions,
    hasRuntime: e.hasRuntime,
    isSystemApp: e.isSystemApp,
    installedAt: e.installedAt?.toISOString(),
    route: e.route,
  }));
}

export const getUserRegistry = listRegistry;

export async function getRegistryEntry(userId: string, bundleId: string) {
  return AppRegistry.findOne({ userId, bundleId });
}

export async function markUpdateAvailable(userId: string, bundleId: string): Promise<void> {
  await AppRegistry.findOneAndUpdate(
    { userId, bundleId, state: 'installed' },
    { state: 'update_available' }
  );
}

export function formatInstalledAppPayload(
  app: InstanceType<typeof App>,
  registry: IAppRegistry,
  installed: { installedAt: Date; pageIndex: number; position?: { row: number; col: number } }
) {
  return {
    id: app._id.toString(),
    bundleId: app.bundleId,
    name: app.name,
    version: registry.version,
    description: app.description,
    icon: app.icon,
    category: app.category,
    permissions: registry.permissions,
    minOSVersion: app.minOSVersion,
    isSystemApp: app.isSystemApp,
    route: registry.route,
    entryPoint: registry.entryPoint,
    installedAt: installed.installedAt.toISOString(),
    pageIndex: installed.pageIndex,
    position: installed.position,
    hasRuntime: registry.hasRuntime,
  };
}
