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

export type DateFormat = 'mdy' | 'dmy' | 'ymd';
export type TimeFormat = '12h' | '24h';
export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type DistanceUnit = 'km' | 'mi';
export type DisplayZoom = 'default' | 'large' | 'larger';
export type RefreshRate = 60 | 90 | 120;

export interface UserSettings {
  theme: ThemeMode;
  accentColor: AccentColor;
  wallpaper: WallpaperConfig;
  language: string;
  region: string;
  timezone: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  temperatureUnit: TemperatureUnit;
  distanceUnit: DistanceUnit;
  currency: string;
  keyboardLayout: 'qwerty' | 'azerty' | 'qwertz' | 'arabic';
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
  autoTheme: boolean;
  displayZoom: DisplayZoom;
  animationsEnabled: boolean;
  autoBrightness: boolean;
  refreshRate: RefreshRate;
  screenTimeout: number;
  alwaysOnDisplay: boolean;
  mediaVolume: number;
  callVolume: number;
  notificationVolume: number;
  alarmVolume: number;
  vibrationEnabled: boolean;
  ringtone: string;
  notificationSound: string;
  keyboardSound: boolean;
  mobileDataEnabled: boolean;
  hotspotEnabled: boolean;
  airplaneMode: boolean;
  powerSavingMode: boolean;
  lowPowerMode: boolean;
  voiceOverEnabled: boolean;
  largeText: boolean;
  boldText: boolean;
  colorFilters: boolean;
  monoAudio: boolean;
  touchAssistance: boolean;
  developerModeEnabled: boolean;
  twoFactorEnabled: boolean;
  appLockEnabled: boolean;
  defaultApps?: Record<string, string>;
  dockApps?: string[];
  updatedAt?: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
}

export interface DeviceAboutInfo {
  model: string;
  deviceName: string;
  developer: string;
  manufacturer: string;
  operatingSystem: string;
  kernel: string;
  hardwareVersion: string;
  buildNumber: string;
  osVersion: string;
  deviceUuid: string;
  serialNumber: string;
  storage: { total: number; used: number; free: number };
  ram: { total: number; used: number };
  cpu: string;
  gpu: string;
  batteryHealth: number;
  imei?: string;
  generation?: string;
  deviceModel?: string;
  deviceColor?: string;
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
  | 'device:profile:update'
  | 'device:power:update'
  | 'device:power:emergency'
  | 'device:security:update'
  | 'device:security:unlocked'
  | 'device:security:remote_lock'
  | 'device:security:remote_wipe'
  | 'device:backup:complete'
  | 'device:backup:progress'
  | 'device:backup:restored'
  | 'device:sync:complete'
  | 'device:sync:progress'
  | 'device:maintenance:complete'
  | 'device:recovery:update'
  | 'device:recovery:factory_reset'
  | 'device:ecosystem:ready'
  | 'device:diagnostics:extended'
  | 'system-apps:ready'
  | 'gallery:update'
  | 'camera:capture'
  | 'calendar:update'
  | 'clock:update'
  | 'notes:update'
  | 'voice-recorder:update'
  | 'weather:update'
  | 'maps:update'
  | 'files:update'
  | 'system:ready'
  | 'system:error'
  | 'location:update'
  | 'network:update'
  | 'world:update'
  | 'tower:update'
  | 'signal:update'
  | 'gps:update'
  | 'vpn:update'
  | 'carrier:update'
  | 'tracking:update'
  | 'message:new'
  | 'message:delivered'
  | 'message:read'
  | 'message:edited'
  | 'message:deleted'
  | 'conversation:new'
  | 'conversation:member_added'
  | 'presence:update'
  | 'typing:update'
  | 'reaction:update'
  | 'attachment:progress'
  | 'attachment:ready'
  | 'sync:complete'
  | 'battery:update'
  | 'device:update'
  | 'permission:update'
  | 'job:update'
  | 'diagnostics:update'
  | 'service:health'
  | 'police:dispatch:new'
  | 'police:dispatch:update'
  | 'police:unit:update'
  | 'police:officer:status'
  | 'police:911:new'
  | 'police:panic'
  | 'police:bolo:new'
  | 'police:warrant:new'
  | 'police:case:update'
  | 'police:evidence:new'
  | 'police:chat:message'
  | 'police:announcement'
  | 'police:emergency:broadcast'
  | 'police:gps:update'
  | 'police:initialized'
  | 'poetry:initialized'
  | 'poetry:poem:new'
  | 'poetry:poem:update'
  | 'poetry:poem:published'
  | 'poetry:comment:new'
  | 'poetry:like'
  | 'poetry:notification'
  | 'poetry:announcement'
  | 'poetry:event:update'
  | 'poetry:competition:update'
  | 'poetry:challenge:update'
  | 'poetry:moderation'
  | 'poetry:trending:update'
  | 'browser:initialized'
  | 'browser:tab:update'
  | 'browser:tab:sync'
  | 'browser:download:progress'
  | 'browser:download:complete'
  | 'browser:history:update'
  | 'browser:bookmark:update'
  | 'browser:notification'
  | 'browser:session:sync'
  | 'chat:initialized'
  | 'chat:conversation:update'
  | 'chat:message:request'
  | 'chat:call:ringing'
  | 'chat:call:update'
  | 'chat:call:ended'
  | 'chat:poll:update'
  | 'chat:typing'
  | 'chat:presence'
  | 'chat:notification'
  | 'chat:sync'
  | 'justice:initialized'
  | 'justice:case:update'
  | 'justice:hearing:update'
  | 'justice:trial:update'
  | 'justice:evidence:update'
  | 'justice:warrant:review'
  | 'justice:appeal:update'
  | 'justice:judgment:issued'
  | 'justice:sentence:issued'
  | 'justice:courtroom:live'
  | 'justice:docket:update'
  | 'justice:notification'
  | 'justice:search:complete'
  | 'justice:subpoena:issued'
  | 'justice:citation:resolved'
  | 'ems:initialized'
  | 'ems:dispatch:new'
  | 'ems:dispatch:update'
  | 'ems:unit:update'
  | 'ems:personnel:status'
  | 'ems:911:new'
  | 'ems:patient:update'
  | 'ems:ambulance:gps'
  | 'ems:hospital:capacity'
  | 'ems:incident:update'
  | 'ems:alert'
  | 'ems:helicopter:dispatch'
  | 'ems:search:complete'
  | 'ems:admission:update'
  | 'ems:queue:update'
  | 'business:initialized'
  | 'business:company:update'
  | 'business:revenue:update'
  | 'business:expense:update'
  | 'business:payroll:update'
  | 'business:inventory:update'
  | 'business:employee:update'
  | 'business:report:ready'
  | 'business:notification'
  | 'business:bank:transaction'
  | 'business:status:change'
  | 'business:analytics:update'
  | 'business:invoice:update'
  | 'business:contract:update'
  | 'business:government:alert';

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
  signalBars?: number;
  signalDbm?: number;
  generation?: string;
  connectionType?: string;
  pingMs?: number;
  cellTowers: { id: string; strength: number; band: string }[];
  internetConnected: boolean;
  vpnEnabled: boolean;
  vpnName?: string;
  coverage: string;
  latencyMs: number;
  bandwidthMbps: number;
  packetLoss: number;
  jitterMs: number;
  congestion?: number;
  penalties?: Record<string, number>;
  connectionState: 'connected' | 'connecting' | 'disconnected' | 'limited';
  wifiEnabled: boolean;
  wifiSsid?: string;
  bluetoothEnabled: boolean;
}

export type ConnectionGeneration = 'none' | 'emergency' | '2g' | '3g' | '4g' | '5g';

export interface WorldStateSnapshot {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  altitude: number;
  district: string;
  street: string;
  zone: string;
  region: string;
  vehicleState: string;
  weather: string;
  timeOfDay: string;
  gameHour: number;
  interior: boolean;
  safeZone: boolean;
  restrictedZone: boolean;
  nearestLocationId?: string;
  connectedTowerUuid?: string;
  lastTickAt: string;
}

export interface CellTowerSnapshot {
  towerUuid: string;
  towerName: string;
  latitude: number;
  longitude: number;
  coverageRadiusM: number;
  signalPower: number;
  frequencyBand: string;
  carrier: string;
  towerHealth: number;
  currentUsers: number;
  maxUsers: number;
  status: string;
  maintenance: boolean;
  district: string;
  handoff?: boolean;
  distanceM?: number;
}

export interface SignalSnapshot {
  signalBars: number;
  signalDbm: number;
  generation: ConnectionGeneration;
  carrier: string;
  latencyMs?: number;
  bandwidthMbps?: number;
  packetLoss?: number;
  jitterMs?: number;
  congestion?: number;
}

export interface GpsStateSnapshot {
  navigating: boolean;
  destination: {
    locationId?: string;
    name: string;
    latitude?: number;
    longitude?: number;
  } | null;
  distanceRemainingM: number;
  etaSeconds: number;
  savedPlaces: { locationId: string; name: string; lat: number; lng: number }[];
  recentPlaces: { locationId: string; name: string; lat: number; lng: number; visitedAt?: string }[];
  favoritePlaces: { locationId: string; name: string; lat: number; lng: number }[];
  sharingEnabled: boolean;
  arrived?: boolean;
}

export interface VpnStateSnapshot {
  active: boolean;
  country?: string | null;
  countryName?: string | null;
  virtualIp?: string | null;
  encryption?: string | null;
  latencyPenaltyMs?: number;
  bandwidthPenaltyMbps?: number;
  connectedAt?: string;
}

export interface CarrierStateSnapshot {
  name: string;
  generation: ConnectionGeneration;
  connectedTowerUuid: string | null;
}

export type CommunicationMessageType =
  | 'sms' | 'private_chat' | 'group_chat' | 'broadcast' | 'announcement'
  | 'system' | 'emergency' | 'police' | 'justice' | 'bank' | 'verification'
  | 'silent' | 'hidden';

export type CommunicationContentType =
  | 'text' | 'image' | 'video' | 'voice_note' | 'audio' | 'pdf' | 'document'
  | 'contact' | 'location' | 'live_location' | 'money_request' | 'bank_transfer'
  | 'identity_card' | 'qr' | 'barcode' | 'gif' | 'emoji';

export type ConversationType =
  | 'private' | 'group' | 'organization' | 'government' | 'police'
  | 'justice' | 'emergency' | 'bank' | 'business' | 'announcement';

export type PresenceState =
  | 'online' | 'offline' | 'idle' | 'typing' | 'recording_voice'
  | 'uploading' | 'downloading' | 'reading' | 'invisible' | 'dnd';

export type DeliveryState =
  | 'queued' | 'uploading' | 'encrypting' | 'sending' | 'sent'
  | 'delivered' | 'read' | 'failed' | 'retry' | 'cancelled';

export interface ConversationSnapshot {
  conversationId: string;
  type: ConversationType;
  title?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  memberCount: number;
  unreadCount: number;
  isEncrypted: boolean;
  pinned?: boolean;
  muted?: boolean;
}

export interface MessageSnapshot {
  messageId: string;
  conversationId: string;
  senderId: string;
  messageType: CommunicationMessageType;
  contentType: CommunicationContentType;
  body: string;
  sentAt?: string;
  editedAt?: string;
  deliveryState: DeliveryState | string;
  mentions: string[];
  reactions?: { emoji: string; count: number; userIds: string[] }[];
  attachments?: unknown[];
}

export interface PresenceSnapshot {
  userId: string;
  state: PresenceState;
  online: boolean;
  lastSeenAt: string;
  lastActiveAt: string;
  customStatus?: string;
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

// ─── Device Ecosystem (Phase 3.5) ───────────────────────────────────────────

export interface DeviceProfileSnapshot {
  deviceName: string;
  deviceModel: string;
  deviceColor: string;
  serialNumber: string;
  deviceUuid: string;
  generation: string;
  purchaseDate?: string;
  warrantyExpiresAt?: string;
  warrantyActive?: boolean;
  region?: string;
  language?: string;
  timezone?: string;
  osVersion?: string;
  internalStorage?: number;
  batteryLevel?: number;
  batteryHealth?: number;
}

export interface PowerStateSnapshot {
  batteryLevel: number;
  batteryHealth: number;
  chargingCycles: number;
  chargingType: 'none' | 'wired' | 'fast' | 'wireless';
  isCharging: boolean;
  fastChargingEnabled: boolean;
  wirelessChargingEnabled: boolean;
  powerMode: 'normal' | 'low_power' | 'critical' | 'emergency_shutdown';
  degradationRate: number;
  lastChargeAt?: string;
  emergencyShutdownAt?: string;
}

export interface SecurityConfigSnapshot {
  faceUnlockEnabled: boolean;
  fingerprintEnabled: boolean;
  pinEnabled: boolean;
  passwordEnabled: boolean;
  primaryUnlockMethod: string;
  trustedDevices: Array<{ deviceId: string; deviceName: string; lastSeenAt: string; trustedAt: string }>;
  failedAttempts: number;
  tempLocked: boolean;
  tempLockedUntil?: string;
  remoteLocked: boolean;
  remoteWipeRequested: boolean;
  lastUnlockAt?: string;
}

export interface ExpandedStorageSnapshot {
  downloads: number;
  trash: number;
  cache: number;
  applicationData: number;
  mediaLibrary: number;
  system: number;
}

export interface BackupSnapshot {
  backupId: string;
  backupType: 'automatic' | 'manual';
  state: string;
  version: number;
  sizeBytes?: number;
  completedAt?: string;
  restoredAt?: string;
}

export interface SyncStatusSnapshot {
  syncing: boolean;
  activeSyncId?: string;
  progress: number;
  lastSyncAt?: string;
}

export interface RecoveryStateSnapshot {
  recoveryMode: 'normal' | 'safe' | 'recovery';
  safeModeEnabled: boolean;
  factoryResetPending: boolean;
  rollbackVersion?: string;
  lastRecoveryAt?: string;
}

export interface MaintenanceRecordSnapshot {
  action: string;
  status: string;
  bytesFreed?: number;
  itemsProcessed?: number;
  durationMs?: number;
  createdAt: string;
}

export interface ExtendedDiagnosticsReport extends DiagnosticsReport {
  power?: PowerStateSnapshot;
  sensors?: Record<string, unknown>;
  systemHealth?: { score: number; powerMode: string; chargingCycles: number };
  errorReports?: Array<{ message: string; category: string; at: string }>;
}
