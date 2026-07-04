import crypto from 'crypto';
import { Types } from 'mongoose';
import { InstalledPackage } from '../database/models/InstalledPackage';
import { App } from '../database/models/App';
import { Developer } from '../database/models/Developer';
import { StoreListing } from '../database/models/StoreListing';
import type { PackageManifest } from './packageService';

function buildSignature(bundleId: string, version: string, checksum: string): string {
  return crypto.createHash('sha256').update(`${bundleId}:${version}:${checksum}`).digest('hex').slice(0, 32);
}

export async function registerInstalledPackage(
  userId: string,
  manifest: PackageManifest,
  installedSize: number
): Promise<void> {
  const app = await App.findOne({ bundleId: manifest.bundleId });
  const listing = await StoreListing.findOne({ bundleId: manifest.bundleId });
  let developerName = 'Unknown';
  if (listing?.developerId) {
    const dev = await Developer.findById(listing.developerId);
    developerName = dev?.name ?? developerName;
  }

  const buildNumber = manifest.version.split('.').join('');

  await InstalledPackage.findOneAndUpdate(
    { userId, bundleId: manifest.bundleId },
    {
      userId: new Types.ObjectId(userId),
      bundleId: manifest.bundleId,
      packageId: `${manifest.bundleId}@${manifest.version}`,
      version: manifest.version,
      buildNumber,
      size: manifest.size,
      installedSize,
      cacheSize: Math.floor(installedSize * 0.08),
      dataSize: 0,
      developer: developerName,
      permissions: [...manifest.requiredPermissions, ...manifest.optionalPermissions],
      dependencies: manifest.dependencies,
      installDate: new Date(),
      lastUpdate: new Date(),
      digitalSignature: buildSignature(manifest.bundleId, manifest.version, manifest.checksum),
    },
    { upsert: true, new: true }
  );
}

export async function updateInstalledPackage(
  userId: string,
  bundleId: string,
  manifest: PackageManifest,
  installedSize: number
): Promise<void> {
  await InstalledPackage.findOneAndUpdate(
    { userId, bundleId },
    {
      version: manifest.version,
      buildNumber: manifest.version.split('.').join(''),
      size: manifest.size,
      installedSize,
      lastUpdate: new Date(),
      digitalSignature: buildSignature(bundleId, manifest.version, manifest.checksum),
    }
  );
}

export async function removeInstalledPackage(userId: string, bundleId: string): Promise<void> {
  await InstalledPackage.deleteOne({ userId, bundleId });
}

export async function getInstalledPackage(userId: string, bundleId: string) {
  return InstalledPackage.findOne({ userId, bundleId });
}

export async function listInstalledPackages(userId: string) {
  const packages = await InstalledPackage.find({ userId }).sort({ installedSize: -1 });
  return packages.map((p) => ({
    bundleId: p.bundleId,
    packageId: p.packageId,
    version: p.version,
    buildNumber: p.buildNumber,
    size: p.size,
    installedSize: p.installedSize,
    cacheSize: p.cacheSize,
    dataSize: p.dataSize,
    developer: p.developer,
    permissions: p.permissions,
    dependencies: p.dependencies,
    installDate: p.installDate.toISOString(),
    lastUpdate: p.lastUpdate.toISOString(),
    digitalSignature: p.digitalSignature,
  }));
}
