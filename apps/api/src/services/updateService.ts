import { InstalledApp } from '../database/models/InstalledApp';
import { App } from '../database/models/App';
import { StoreListing } from '../database/models/StoreListing';
import { UserStoreSettings } from '../database/models/UserStoreSettings';
import { StoreDownload } from '../database/models/StoreDownload';
import { compareVersions, getPackageManifest } from './packageService';
import { enqueueDownload } from './downloadManager';
import { markUpdateAvailable } from './appRegistryService';

export async function detectUpdates(userId: string) {
  const installed = await InstalledApp.find({ userId }).populate('appId');
  const updates = [];

  for (const item of installed) {
    const app = item.appId as unknown as InstanceType<typeof App>;
    if (compareVersions(app.version, item.installedVersion) > 0) {
      const listing = await StoreListing.findOne({ bundleId: item.bundleId });
      const pkg = await getPackageManifest(item.bundleId, app.version);
      await markUpdateAvailable(userId, item.bundleId);
      updates.push({
        bundleId: item.bundleId,
        name: app.name,
        icon: app.icon,
        installedVersion: item.installedVersion,
        latestVersion: app.version,
        size: listing?.storageSize ?? pkg.size,
        changelog: pkg.changelog,
        incremental: !!pkg.changelog,
      });
    }
  }

  return updates;
}

export async function startUpdate(
  userId: string,
  bundleId: string,
  approvedPermissions: string[]
): Promise<{ downloadId: string }> {
  const installed = await InstalledApp.findOne({ userId, bundleId });
  if (!installed) throw new Error('App not installed');

  const app = await App.findOne({ bundleId });
  const listing = await StoreListing.findOne({ bundleId });
  if (!app || !listing) throw new Error('App not found');

  if (installed.installedVersion === app.version) {
    throw new Error('App is already up to date');
  }

  const download = await StoreDownload.create({
    userId,
    bundleId,
    appName: app.name,
    appIcon: app.icon,
    type: 'update',
    status: 'queued',
    version: installed.installedVersion,
    targetVersion: app.version,
    size: listing.storageSize,
    approvedPermissions,
    previousVersion: installed.installedVersion,
  });

  await enqueueDownload(download._id.toString(), userId);

  return { downloadId: download._id.toString() };
}

export async function runAutoUpdates(userId: string): Promise<string[]> {
  const settings = await UserStoreSettings.findOne({ userId });
  if (!settings?.autoUpdate) return [];

  const updates = await detectUpdates(userId);
  const started: string[] = [];

  for (const update of updates) {
    const listing = await StoreListing.findOne({ bundleId: update.bundleId });
    const perms = listing?.permissions ?? [];
    const { downloadId } = await startUpdate(userId, update.bundleId, [...perms]);
    started.push(downloadId);
  }

  return started;
}

export async function getUpdateChangelog(bundleId: string, version: string): Promise<string> {
  const manifest = await getPackageManifest(bundleId, version);
  return manifest.changelog;
}

export const checkForUpdates = detectUpdates;

export async function getChangelog(bundleId: string, fromVersion: string, toVersion: string): Promise<string> {
  void fromVersion;
  return getUpdateChangelog(bundleId, toVersion);
}

export async function setAutoUpdate(userId: string, bundleId: string, enabled: boolean) {
  void bundleId;
  const settings = await UserStoreSettings.findOneAndUpdate(
    { userId },
    { autoUpdate: enabled },
    { new: true, upsert: true }
  );
  return {
    bundleId,
    autoUpdate: settings.autoUpdate,
  };
}
