export type AppLifecycleState =
  | 'not_installed'
  | 'downloading'
  | 'paused'
  | 'installing'
  | 'installed'
  | 'update_available'
  | 'updating'
  | 'uninstalling'
  | 'disabled'
  | 'failed';

export interface StoreDeveloper {
  id: string;
  name: string;
  logo: string;
  verified: boolean;
  slug?: string;
  description?: string;
  website?: string;
  appCount?: number;
  apps?: StoreApp[];
}

export interface StoreApp {
  id: string;
  appId: string;
  bundleId: string;
  name: string;
  version: string;
  description: string;
  tagline: string;
  longDescription?: string;
  icon: string;
  category: string;
  screenshots: string[];
  videoUrl?: string;
  featured: boolean;
  trending: boolean;
  editorsChoice: boolean;
  recommended: boolean;
  verified: boolean;
  premium: boolean;
  price: number;
  currency: string;
  ratingAverage: number;
  ratingCount: number;
  downloadCount: number;
  storageSize: number;
  permissions: string[];
  minOSVersion: string;
  tags: string[];
  developer: StoreDeveloper | null;
  installed?: boolean;
  installedVersion?: string | null;
  hasUpdate?: boolean;
  versions?: AppVersionInfo[];
  reviews?: StoreReview[];
}

export interface AppVersionInfo {
  version: string;
  changelog: string;
  releaseDate: string;
  size: number;
}

export interface StoreReview {
  id: string;
  username: string;
  rating: number;
  title: string;
  body: string;
  helpful: number;
  createdAt: string;
}

export interface StoreCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

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
}

export interface RegistryEntry {
  bundleId: string;
  name: string;
  icon: string;
  version: string;
  state: AppLifecycleState;
  category: string;
  permissions: string[];
  hasRuntime: boolean;
  isSystemApp: boolean;
  installedAt?: string;
  route?: string;
}

export interface InstalledStoreApp {
  bundleId: string;
  name: string;
  icon: string;
  installedVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  storageBytes: number;
  installedAt: string;
  updatedAt: string;
  lastUsedAt: string;
  isSystemApp: boolean;
  permissions: string[];
  state?: AppLifecycleState;
}

export interface AppStorageInfo {
  appSize: number;
  userDataSize: number;
  cacheSize: number;
  tempSize: number;
  downloadsSize: number;
  logsSize: number;
  documentsSize: number;
  mediaSize: number;
  totalSize: number;
}

export interface StoreDownload {
  id: string;
  bundleId: string;
  appName: string;
  appIcon: string;
  type: 'install' | 'update';
  status: 'queued' | 'downloading' | 'paused' | 'installing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  version: string;
  targetVersion: string;
  size: number;
  downloadedBytes: number;
  downloadSpeed?: number;
  etaSeconds?: number;
  queuePosition?: number;
  installStep?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface StoreSettings {
  autoUpdate: boolean;
  cellularDownloads: boolean;
  notifyUpdates: boolean;
}

export type StoreTab = 'today' | 'apps' | 'search' | 'updates' | 'library';

export interface ActiveInstall {
  downloadId: string;
  bundleId: string;
  appName: string;
  appIcon: string;
  type: 'install' | 'update';
  progress: number;
  status: string;
  downloadSpeed?: number;
  etaSeconds?: number;
  installStep?: string;
  size?: number;
  downloadedBytes?: number;
}

export interface PendingInstall {
  bundleId: string;
  appName: string;
  appIcon: string;
  type: 'install' | 'update';
  manifest: PackageManifest;
}
