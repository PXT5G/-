import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  LockScreenLayout,
  ClockFont,
  ClockColor,
  WallpaperCollection,
  MultitaskingMode,
  NotificationGroupStrategy,
} from '../../constants/premiumExperience';
import { auditSchemaFields } from '../baseSchema';

export interface ILockScreenWidget {
  type: string;
  position: 'top' | 'middle' | 'bottom';
  config: Record<string, unknown>;
}

export interface IPremiumExperienceProfile extends Document {
  userId: Types.ObjectId;
  lockScreenLayout: LockScreenLayout;
  clockFont: ClockFont;
  clockColor: ClockColor;
  wallpaperCollection: WallpaperCollection;
  liveWallpaper: boolean;
  depthWallpaper: boolean;
  lockScreenWidgets: ILockScreenWidget[];
  quickNotes: string[];
  smartSuggestions: boolean;
  chargingAnimation: boolean;
  unlockAnimation: string;
  homeBlurIntensity: number;
  unlimitedPages: boolean;
  smartFolders: boolean;
  hiddenPageIndexes: number[];
  iconPackId: string;
  iconSize: 'small' | 'medium' | 'large';
  dockApps: string[];
  hiddenApps: string[];
  multitaskingMode: MultitaskingMode;
  pinnedApps: string[];
  lockedApps: string[];
  dynamicIslandMaxActivities: number;
  dynamicIslandEnabledTypes: string[];
  notificationGroupStrategy: NotificationGroupStrategy;
  pinnedNotificationIds: string[];
  notificationHistoryEnabled: boolean;
  controlCenterPages: string[];
  controlCenterControls: string[];
  controlCenterPageIndex: number;
  appLibrarySuggestions: boolean;
  appLibraryAiRecommendations: boolean;
  reduceMotionOverride: boolean;
  blurIntensity: number;
  parallaxEnabled: boolean;
  animationScale: number;
  lastUsedApps: { bundleId: string; usedAt: Date; count: number }[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const lockScreenWidgetSchema = new Schema<ILockScreenWidget>(
  {
    type: { type: String, required: true },
    position: { type: String, enum: ['top', 'middle', 'bottom'], default: 'middle' },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const lastUsedAppSchema = new Schema(
  {
    bundleId: { type: String, required: true },
    usedAt: { type: Date, default: Date.now },
    count: { type: Number, default: 1 },
  },
  { _id: false }
);

const premiumExperienceProfileSchema = new Schema<IPremiumExperienceProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    lockScreenLayout: { type: String, enum: ['classic', 'minimal', 'stacked', 'split', 'focus'], default: 'classic' },
    clockFont: { type: String, enum: ['system', 'rounded', 'serif', 'mono', 'condensed'], default: 'system' },
    clockColor: { type: String, enum: ['white', 'gold', 'blue', 'green', 'red', 'gradient'], default: 'white' },
    wallpaperCollection: { type: String, default: 'gulf-default' },
    liveWallpaper: { type: Boolean, default: true },
    depthWallpaper: { type: Boolean, default: true },
    lockScreenWidgets: { type: [lockScreenWidgetSchema], default: () => [
      { type: 'weather', position: 'top', config: {} },
      { type: 'battery', position: 'bottom', config: {} },
    ] },
    quickNotes: { type: [String], default: [] },
    smartSuggestions: { type: Boolean, default: true },
    chargingAnimation: { type: Boolean, default: true },
    unlockAnimation: { type: String, default: 'spring' },
    homeBlurIntensity: { type: Number, default: 0.3 },
    unlimitedPages: { type: Boolean, default: true },
    smartFolders: { type: Boolean, default: true },
    hiddenPageIndexes: { type: [Number], default: [] },
    iconPackId: { type: String, default: 'default' },
    iconSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    dockApps: { type: [String], default: ['com.gulfos.phone', 'com.gulfos.chat', 'com.gulfos.store', 'com.gulfos.settings'] },
    hiddenApps: { type: [String], default: [] },
    multitaskingMode: { type: String, enum: ['cards', 'grid', 'horizontal'], default: 'cards' },
    pinnedApps: { type: [String], default: [] },
    lockedApps: { type: [String], default: [] },
    dynamicIslandMaxActivities: { type: Number, default: 2 },
    dynamicIslandEnabledTypes: {
      type: [String],
      default: ['call', 'music', 'navigation', 'charging', 'download', 'ems', 'police', 'stocks', 'live_activity'],
    },
    notificationGroupStrategy: { type: String, enum: ['app', 'priority', 'time', 'category'], default: 'app' },
    pinnedNotificationIds: { type: [String], default: [] },
    notificationHistoryEnabled: { type: Boolean, default: true },
    controlCenterPages: { type: [String], default: ['connectivity', 'media', 'device', 'shortcuts'] },
    controlCenterControls: { type: [String], default: [] },
    controlCenterPageIndex: { type: Number, default: 0 },
    appLibrarySuggestions: { type: Boolean, default: true },
    appLibraryAiRecommendations: { type: Boolean, default: true },
    reduceMotionOverride: { type: Boolean, default: false },
    blurIntensity: { type: Number, default: 0.85 },
    parallaxEnabled: { type: Boolean, default: true },
    animationScale: { type: Number, default: 1 },
    lastUsedApps: { type: [lastUsedAppSchema], default: [] },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PremiumExperienceProfile = mongoose.model<IPremiumExperienceProfile>(
  'PremiumExperienceProfile',
  premiumExperienceProfileSchema
);
