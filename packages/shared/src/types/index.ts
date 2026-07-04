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
  | 'biometrics'
  | 'phone'
  | 'bluetooth'
  | 'sim'
  | 'files';

export type SystemPermissionType = PermissionType;

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
  | 'device:update:rollback'
  | 'system:ready'
  | 'system:error'
  | 'location:update'
  | 'network:update'
  | 'battery:update'
  | 'device:update'
  | 'permission:update'
  | 'job:update'
  | 'diagnostics:update'
  | 'service:health';

export interface SocketPayload {
  event: SocketEvent;
  data: unknown;
  timestamp: string;
}

export interface DeviceLocationState {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  altitude: number;
  accuracy: number;
  district: string;
  street: string;
  zone: string;
  region: string;
  gpsTimestamp: string;
  movementState: 'stationary' | 'walking' | 'driving' | 'unknown';
  enabled: boolean;
}

export interface NetworkStateSnapshot {
  carrier: string;
  signalStrength: number;
  cellTowers: { id: string; strength: number; band: string }[];
  internetConnected: boolean;
  vpnEnabled: boolean;
  vpnName?: string;
  coverage: string;
  latencyMs: number;
  bandwidthMbps: number;
  packetLoss: number;
  jitterMs: number;
  connectionState: 'connected' | 'connecting' | 'disconnected' | 'limited';
  wifiEnabled: boolean;
  wifiSsid?: string;
  bluetoothEnabled: boolean;
}

export interface DeviceStateSnapshot {
  batteryLevel: number;
  batteryHealth: number;
  isCharging: boolean;
  temperature: number;
  screenState: 'on' | 'off' | 'dimmed';
  lockState: 'locked' | 'unlocked';
  ramUsed: number;
  ramTotal: number;
  storageUsed: number;
  storageTotal: number;
  cpuLoad: number;
  gpuLoad: number;
  deviceHealth: number;
  lowPowerMode: boolean;
  criticalMode: boolean;
  emergencyMode: boolean;
  lastSnapshotAt: string;
}

export type JobStatus =
  | 'queued'
  | 'running'
  | 'retry'
  | 'cancelled'
  | 'completed'
  | 'failed';

export interface BackgroundJobInfo {
  id: string;
  type: string;
  name: string;
  status: JobStatus;
  priority: 'low' | 'normal' | 'high' | 'critical';
  progress: number;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface DiagnosticsReport {
  memory: { used: number; total: number; pressure: boolean };
  cpu: { load: number; model: string };
  gpu: { load: number; model: string };
  fps: number;
  storage: { used: number; total: number; health: number };
  network: { latency: number; bandwidth: number; connected: boolean };
  battery: { level: number; health: number; charging: boolean };
  temperature: number;
  backgroundJobs: { running: number; queued: number; failed: number };
  socketConnected: boolean;
  serviceHealth: Record<string, 'healthy' | 'degraded' | 'down'>;
  errors: string[];
  warnings: string[];
  collectedAt: string;
}

export interface SystemEventInfo {
  id: string;
  namespace: string;
  event: string;
  payload: Record<string, unknown>;
  priority: number;
  source: string;
  createdAt: string;
}
