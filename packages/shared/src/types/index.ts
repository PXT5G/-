export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'gold' | 'white' | 'black';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface Session {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  ipAddress?: string;
  userAgent?: string;
  lastActiveAt: string;
  createdAt: string;
}

export type AppCategory =
  | 'system'
  | 'productivity'
  | 'communication'
  | 'media'
  | 'utilities'
  | 'finance'
  | 'social';

export interface AppManifest {
  id: string;
  name: string;
  bundleId: string;
  version: string;
  description: string;
  icon: string;
  category: AppCategory;
  permissions: PermissionType[];
  minOSVersion: string;
  isSystemApp: boolean;
  route?: string;
  entryPoint?: string;
}

export type PermissionType =
  | 'camera'
  | 'microphone'
  | 'location'
  | 'contacts'
  | 'photos'
  | 'notifications'
  | 'storage'
  | 'network'
  | 'biometrics';

export interface InstalledApp extends AppManifest {
  installedAt: string;
  position?: GridPosition;
  folderId?: string;
  pageIndex?: number;
}

export interface GridPosition {
  row: number;
  col: number;
}

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface OSNotification {
  id: string;
  appId: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  priority: NotificationPriority;
  timestamp: string;
  read: boolean;
  actions?: NotificationAction[];
  groupId?: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  destructive?: boolean;
}

export interface WidgetDefinition {
  id: string;
  appId: string;
  name: string;
  sizes: WidgetSize[];
  defaultSize: WidgetSize;
  refreshInterval?: number;
}

export type WidgetSize = 'small' | 'medium' | 'large';

export interface WidgetInstance {
  id: string;
  widgetId: string;
  appId: string;
  size: WidgetSize;
  pageIndex: number;
  position: GridPosition;
  config?: Record<string, unknown>;
}

export interface WallpaperConfig {
  id: string;
  type: 'gradient' | 'image' | 'animated';
  light?: string;
  dark?: string;
  url?: string;
  animatedClass?: string;
}

export interface UserSettings {
  theme: ThemeMode;
  accentColor: AccentColor;
  wallpaper: WallpaperConfig;
  language: string;
  reduceMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  hapticsEnabled: boolean;
  soundsEnabled: boolean;
  brightness: number;
  volume: number;
  wifiEnabled: boolean;
  bluetoothEnabled: boolean;
  silentMode: boolean;
  rotationLock: boolean;
  flashlightEnabled: boolean;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size?: number;
  parentId: string | null;
  path: string;
  createdAt: string;
  updatedAt: string;
}

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export type OSPhase =
  | 'splash'
  | 'booting'
  | 'locked'
  | 'unlocking'
  | 'home'
  | 'app';

export type UnlockMethod = 'swipe' | 'pin' | 'face' | 'fingerprint';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type SocketEvent =
  | 'notification:new'
  | 'notification:read'
  | 'app:installed'
  | 'app:uninstalled'
  | 'settings:updated'
  | 'session:expired'
  | 'system:broadcast'
  | 'store:download:progress'
  | 'store:download:complete'
  | 'store:download:cancelled'
  | 'store:download:paused'
  | 'store:download:resumed'
  | 'store:update:complete'
  | 'device:storage:updated'
  | 'device:storage:warning'
  | 'device:ram:updated'
  | 'device:memory:pressure'
  | 'device:update:complete'
  | 'device:update:rollback';

export interface SocketPayload {
  event: SocketEvent;
  data: unknown;
  timestamp: string;
}
