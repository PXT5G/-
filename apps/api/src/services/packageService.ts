import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { App } from '../database/models/App';
import { AppPackage, IAppPackage } from '../database/models/AppPackage';
import { AppVersion } from '../database/models/AppVersion';
import { StoreListing } from '../database/models/StoreListing';
import { getAppPackageSize } from '../constants/appSizes';
import { resolveBundleId, bundleIdVariants } from '../utils/bundleIdMigration';

const PACKAGES_DIR = path.join(process.cwd(), 'data', 'packages');
const GULFOS_VERSION = '1.0.0';

const RUNTIME_APPS = new Set([
  'com.gulfos.settings',
  'com.gulfos.store',
  'com.gulfos.identity',
  'com.gulfos.bank',
  'com.gulfos.sim',
  'com.gulfos.contacts',
  'com.gulfos.police',
  'com.gulfos.poetry',
  'com.gulfos.browser',
  'com.gulfos.control-panel',
  'com.gulfos.phone',
  'com.gulfos.maps',
  'com.gulfos.camera',
  'com.gulfos.gallery',
  'com.gulfos.files',
  'com.gulfos.calendar',
  'com.gulfos.clock',
  'com.gulfos.calculator',
  'com.gulfos.notes',
  'com.gulfos.recorder',
  'com.gulfos.weather',
]);

export interface PackageManifest {
  bundleId: string;
  version: string;
  checksum: string;
  size: number;
  minOSVersion: string;
  requiredGULFOSVersion: string;
  dependencies: string[];
  requiredPermissions: string[];
  optionalPermissions: string[];
  storageRequired: number;
  internetRequired: boolean;
  backgroundActivity: boolean;
  icons: string[];
  screenshots: string[];
  changelog: string;
  hasRuntime: boolean;
  route?: string;
  entryPoint?: string;
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function isVersionCompatible(installed: string, required: string): boolean {
  return compareVersions(installed, required) >= 0;
}

function sha256(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function ensurePackageDir(bundleId: string, version: string): Promise<string> {
  const dir = path.join(PACKAGES_DIR, bundleId, version);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function buildPackageForApp(bundleId: string, version: string): Promise<IAppPackage> {
  const canonicalId = resolveBundleId(bundleId);
  const app = await App.findOne({ bundleId: { $in: bundleIdVariants(canonicalId) } });
  if (!app) throw new Error(`App not found: ${bundleId}`);

  const listing = await StoreListing.findOne({ bundleId: { $in: bundleIdVariants(canonicalId) } });
  const appVersion = await AppVersion.findOne({ bundleId: { $in: bundleIdVariants(canonicalId) }, version });

  const packageSize = getAppPackageSize(canonicalId, listing?.storageSize ?? appVersion?.size ?? 80_000_000);
  const dir = await ensurePackageDir(canonicalId, version);
  const manifest: PackageManifest = {
    bundleId: canonicalId,
    version,
    checksum: '',
    size: packageSize,
    minOSVersion: listing?.minOSVersion ?? app.minOSVersion,
    requiredGULFOSVersion: GULFOS_VERSION,
    dependencies: [],
    requiredPermissions: (listing?.permissions ?? app.permissions).slice(0, 4),
    optionalPermissions: (listing?.permissions ?? app.permissions).slice(4),
    storageRequired: packageSize,
    internetRequired: true,
    backgroundActivity: ['communication', 'social'].includes(listing?.category ?? app.category),
    icons: [app.icon],
    screenshots: listing?.screenshots ?? [],
    changelog: appVersion?.changelog ?? '',
    hasRuntime: RUNTIME_APPS.has(canonicalId),
    route: app.route,
    entryPoint: app.entryPoint,
  };

  const payload = Buffer.from(JSON.stringify(manifest, null, 0));
  const binPath = path.join(dir, 'package.bpkg.bin');
  await fs.writeFile(binPath, payload);

  manifest.checksum = sha256(payload);
  const manifestPath = path.join(dir, 'package.bpkg.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  const pkg = await AppPackage.findOneAndUpdate(
    { bundleId, version },
    {
      appId: app._id,
      bundleId,
      version,
      checksum: manifest.checksum,
      size: manifest.size,
      minOSVersion: manifest.minOSVersion,
      requiredGULFOSVersion: manifest.requiredGULFOSVersion,
      dependencies: manifest.dependencies,
      requiredPermissions: manifest.requiredPermissions,
      optionalPermissions: manifest.optionalPermissions,
      storageRequired: manifest.storageRequired,
      internetRequired: manifest.internetRequired,
      backgroundActivity: manifest.backgroundActivity,
      icons: manifest.icons,
      screenshots: manifest.screenshots,
      changelog: manifest.changelog,
      packagePath: dir,
    },
    { upsert: true, new: true }
  );

  return pkg;
}

export async function getPackage(bundleId: string, version: string) {
  const canonicalId = resolveBundleId(bundleId);
  const existing = await AppPackage.findOne({ bundleId: { $in: bundleIdVariants(canonicalId) }, version });
  if (existing) return existing;
  return buildPackageForApp(canonicalId, version);
}

export async function getPackageManifest(bundleId: string, version: string): Promise<PackageManifest> {
  const pkg = await getPackage(bundleId, version);
  if (!pkg) throw new Error('Package not found');

  return {
    bundleId: pkg.bundleId,
    version: pkg.version,
    checksum: pkg.checksum,
    size: pkg.size,
    minOSVersion: pkg.minOSVersion,
    requiredGULFOSVersion: pkg.requiredGULFOSVersion,
    dependencies: pkg.dependencies,
    requiredPermissions: pkg.requiredPermissions,
    optionalPermissions: pkg.optionalPermissions,
    storageRequired: pkg.storageRequired,
    internetRequired: pkg.internetRequired,
    backgroundActivity: pkg.backgroundActivity,
    icons: pkg.icons,
    screenshots: pkg.screenshots,
    changelog: pkg.changelog,
    hasRuntime: RUNTIME_APPS.has(resolveBundleId(pkg.bundleId)),
  };
}

export async function verifyPackageIntegrity(bundleId: string, version: string): Promise<boolean> {
  const pkg = await AppPackage.findOne({ bundleId, version });
  if (!pkg) return false;

  const binPath = path.join(pkg.packagePath, 'package.bpkg.bin');
  try {
    const data = await fs.readFile(binPath);
    return sha256(data) === pkg.checksum;
  } catch {
    return false;
  }
}

export async function readPackageBytes(
  bundleId: string,
  version: string,
  offset: number,
  length: number
): Promise<Buffer> {
  const pkg = await AppPackage.findOne({ bundleId, version });
  if (!pkg) throw new Error('Package not found');

  const binPath = path.join(pkg.packagePath, 'package.bpkg.bin');
  const handle = await fs.open(binPath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, offset);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

export async function seedAllPackages(): Promise<number> {
  const apps = await App.find({ isPublished: true });
  let count = 0;
  for (const app of apps) {
    await buildPackageForApp(app.bundleId, app.version);
    count++;
  }
  return count;
}

export async function getStorageRequired(bundleId: string, version: string): Promise<number> {
  const manifest = await getPackageManifest(bundleId, version);
  return manifest.storageRequired;
}

export { RUNTIME_APPS, GULFOS_VERSION };
