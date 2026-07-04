import { Types } from 'mongoose';
import { InstalledApp } from '../database/models/InstalledApp';
import { App } from '../database/models/App';
import { StoreListing } from '../database/models/StoreListing';
import { AppRegistry } from '../database/models/AppRegistry';
import {
  getPackageManifest,
  verifyPackageIntegrity,
  isVersionCompatible,
  GULFOS_VERSION,
  type PackageManifest,
} from './packageService';
import { ensureAppStorageDir, initAppStorage, getAppStorage } from './storageService';
import { registerApp, unregisterApp, setAppState, formatInstalledAppPayload } from './appRegistryService';
import {
  checkAvailableStorage,
  commitReservation,
  releaseReservation,
  freeStorageOnUninstall,
  addSystemUpdateSize,
} from './deviceStorageService';
import { registerInstalledPackage, updateInstalledPackage, removeInstalledPackage } from './installedPackageService';
import { emitToUser } from './socketService';
import { resolveBundleId, bundleIdVariants } from '../utils/bundleIdMigration';

const GRID_COLS = 4;
const GRID_ROWS = 6;

async function findNextGridPosition(userId: string): Promise<{ pageIndex: number; position: { row: number; col: number } }> {
  const installed = await InstalledApp.find({ userId });
  const occupied = new Set(
    installed
      .filter((a) => a.position)
      .map((a) => `${a.pageIndex}:${a.position!.row}:${a.position!.col}`)
  );

  for (let page = 0; page < 5; page++) {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (!occupied.has(`${page}:${row}:${col}`)) {
          return { pageIndex: page, position: { row, col } };
        }
      }
    }
  }
  return { pageIndex: 0, position: { row: 0, col: 0 } };
}

export interface InstallProgress {
  step: string;
  progress: number;
}

const INSTALL_STEPS = [
  'Verifying package integrity',
  'Checking version compatibility',
  'Verifying permissions',
  'Registering application',
  'Creating application storage',
  'Registering routes',
  'Registering icons',
  'Registering notifications',
  'Registering background services',
  'Registering permissions',
  'Registering realtime events',
  'Finishing installation',
];

export async function verifyInstallPrerequisites(
  manifest: PackageManifest,
  approvedPermissions: string[],
  userId?: string
): Promise<void> {
  if (!isVersionCompatible(GULFOS_VERSION, manifest.requiredGULFOSVersion)) {
    throw new Error(`Requires GULFOS ${manifest.requiredGULFOSVersion} or later`);
  }

  const missing = manifest.requiredPermissions.filter((p) => !approvedPermissions.includes(p));
  if (missing.length > 0) {
    throw new Error(`Missing required permissions: ${missing.join(', ')}`);
  }

  const valid = await verifyPackageIntegrity(manifest.bundleId, manifest.version);
  if (!valid) {
    throw new Error('Package integrity verification failed');
  }

  if (userId) {
    const { canInstall } = await import('./lowStorageService');
    const allowed = await canInstall(userId, manifest.storageRequired);
    if (!allowed) {
      throw new Error('INSUFFICIENT_STORAGE');
    }
    const check = await checkAvailableStorage(userId, manifest.storageRequired);
    if (!check.available) {
      throw new Error('INSUFFICIENT_STORAGE');
    }
  }
}

export async function executeInstall(
  userId: string,
  bundleId: string,
  version: string,
  approvedPermissions: string[],
  onProgress?: (p: InstallProgress) => void
): Promise<{ installed: InstanceType<typeof InstalledApp>; payload: Record<string, unknown> }> {
  const canonicalId = resolveBundleId(bundleId);
  const app = await App.findOne({ bundleId: { $in: bundleIdVariants(canonicalId) } });
  const listing = await StoreListing.findOne({ bundleId: { $in: bundleIdVariants(canonicalId) } });
  if (!app || !listing) throw new Error('App not found');

  const manifest = await getPackageManifest(canonicalId, version);
  await verifyInstallPrerequisites(manifest, approvedPermissions, userId);

  for (let i = 0; i < INSTALL_STEPS.length; i++) {
    onProgress?.({ step: INSTALL_STEPS[i], progress: Math.floor(((i + 1) / INSTALL_STEPS.length) * 100) });
    await new Promise((r) => setTimeout(r, 120));
  }

  const storagePath = await ensureAppStorageDir(userId, canonicalId);
  await initAppStorage(userId, canonicalId, manifest.storageRequired);
  const storage = await getAppStorage(userId, canonicalId);
  await commitReservation(userId, canonicalId);
  await registerInstalledPackage(userId, manifest, storage.totalSize);

  const registry = await registerApp(userId, manifest, storagePath, approvedPermissions);
  const grid = await findNextGridPosition(userId);

  const existing = await InstalledApp.findOne({ userId, bundleId: { $in: bundleIdVariants(canonicalId) } });
  let installed: InstanceType<typeof InstalledApp>;

  if (existing) {
    existing.bundleId = canonicalId;
    existing.installedVersion = version;
    existing.storageBytes = storage.totalSize;
    existing.updatedAt = new Date();
    await existing.save();
    installed = existing;
  } else {
    installed = await InstalledApp.create({
      userId: new Types.ObjectId(userId),
      appId: app._id,
      bundleId: canonicalId,
      installedVersion: version,
      storageBytes: storage.totalSize,
      pageIndex: grid.pageIndex,
      position: grid.position,
    });
    await StoreListing.findByIdAndUpdate(listing._id, { $inc: { downloadCount: 1 } });
  }

  const payload = formatInstalledAppPayload(app, registry, {
    installedAt: installed.installedAt,
    pageIndex: installed.pageIndex,
    position: installed.position,
  });

  emitToUser(userId, 'app:installed', payload);
  emitToUser(userId, 'notification:new' as never, {
    id: `install-${bundleId}-${Date.now()}`,
    appId: 'com.gulfos.store',
    title: `${app.name} Installed`,
    body: `Version ${version} is ready to use.`,
    priority: 'normal',
    timestamp: new Date().toISOString(),
    read: false,
  });

  return { installed, payload };
}

export async function executeUpdate(
  userId: string,
  bundleId: string,
  fromVersion: string,
  toVersion: string,
  approvedPermissions: string[]
): Promise<void> {
  await setAppState(userId, bundleId, 'updating');

  try {
    const manifest = await getPackageManifest(bundleId, toVersion);
    await verifyInstallPrerequisites(manifest, approvedPermissions, userId);
    const sizeDelta = Math.max(0, manifest.storageRequired - (await getAppStorage(userId, bundleId)).appSize);
    if (sizeDelta > 0) {
      await addSystemUpdateSize(userId, Math.floor(sizeDelta * 0.3));
    }
    await executeInstall(userId, bundleId, toVersion, approvedPermissions);
    await updateInstalledPackage(userId, bundleId, manifest, (await getAppStorage(userId, bundleId)).totalSize);
    await setAppState(userId, bundleId, 'installed');
  } catch (err) {
    await InstalledApp.findOneAndUpdate({ userId, bundleId }, { installedVersion: fromVersion });
    await releaseReservation(userId, bundleId);
    await setAppState(userId, bundleId, 'installed');
    throw err;
  }
}

export interface UninstallOptions {
  keepUserData?: boolean;
  keepSettings?: boolean;
  keepSession?: boolean;
}

export async function executeUninstall(
  userId: string,
  bundleId: string,
  options: UninstallOptions = {}
): Promise<void> {
  const canonicalId = resolveBundleId(bundleId);
  const app = await App.findOne({ bundleId: { $in: bundleIdVariants(canonicalId) } });
  if (app?.isSystemApp) throw new Error('Cannot uninstall system app');

  await setAppState(userId, canonicalId, 'uninstalling');

  const { removeAppStorage } = await import('./storageService');
  const freedBytes = await removeAppStorage(userId, canonicalId, options);
  await removeInstalledPackage(userId, canonicalId);
  await unregisterApp(userId, canonicalId);
  await InstalledApp.deleteOne({ userId, bundleId: { $in: bundleIdVariants(canonicalId) } });
  await freeStorageOnUninstall(userId, canonicalId, freedBytes);

  const keepAny = options.keepUserData || options.keepSettings || options.keepSession;
  emitToUser(userId, 'app:uninstalled', { bundleId: canonicalId });
  emitToUser(userId, 'notification:new' as never, {
    id: `uninstall-${canonicalId}-${Date.now()}`,
    appId: 'com.gulfos.store',
    title: `${app?.name ?? bundleId} Removed`,
    body: keepAny ? 'App removed. Your data was kept.' : 'App and data removed. Storage freed.',
    priority: 'low',
    timestamp: new Date().toISOString(),
    read: false,
  });
}

export { INSTALL_STEPS };
