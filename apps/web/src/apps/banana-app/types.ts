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
}

export interface StoreDownload {
  id: string;
  bundleId: string;
  appName: string;
  appIcon: string;
  type: 'install' | 'update';
  status: 'queued' | 'downloading' | 'installing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  version: string;
  targetVersion: string;
  size: number;
  downloadedBytes: number;
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
}
