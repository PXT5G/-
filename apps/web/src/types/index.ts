export type {
  ThemeMode,
  AccentColor,
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  Session,
  AppCategory,
  AppManifest,
  PermissionType,
  InstalledApp,
  GridPosition,
  NotificationPriority,
  OSNotification,
  NotificationAction,
  WidgetDefinition,
  WidgetSize,
  WidgetInstance,
  WallpaperConfig,
  UserSettings,
  FileNode,
  WindowState,
  OSPhase,
  UnlockMethod,
  ApiResponse,
  SocketEvent,
  SocketPayload,
  DeviceLocationState,
  NetworkStateSnapshot,
  DeviceStateSnapshot,
  BackgroundJobInfo,
  DiagnosticsReport,
  SystemEventInfo,
  SystemPermissionType,
} from '@bananaos/shared';

export interface AppFolder {
  id: string;
  name: string;
  appIds: string[];
  pageIndex: number;
  position: GridPosition;
}

export interface HomePage {
  index: number;
  apps: string[];
  widgets: string[];
}

export interface DynamicIslandState {
  mode: 'idle' | 'compact' | 'expanded' | 'activity';
  title?: string;
  subtitle?: string;
  icon?: string;
  progress?: number;
}

export interface ControlCenterState {
  isOpen: boolean;
}

export interface SearchResult {
  id: string;
  type: 'app' | 'setting' | 'contact' | 'file';
  title: string;
  subtitle?: string;
  icon?: string;
  action: () => void;
}

export interface HapticPattern {
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  duration?: number;
}

export interface SoundEffect {
  id: string;
  name: string;
  src: string;
  volume?: number;
}

export interface PermissionGrant {
  appId: string;
  permission: PermissionType;
  granted: boolean;
  grantedAt?: string;
}

import type { GridPosition, PermissionType } from '@bananaos/shared';
