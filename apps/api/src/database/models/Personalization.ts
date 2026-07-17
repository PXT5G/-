import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ThemeMode, WallpaperType, IconSize } from '../../constants/personalization';
import { auditSchemaFields } from '../baseSchema';

export interface IThemeProfile extends Document {
  profileId: string;
  userId: Types.ObjectId;
  name: string;
  mode: ThemeMode;
  accentColor: string;
  fontFamily: string;
  animationScale: number;
  blurIntensity: number;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const themeProfileSchema = new Schema<IThemeProfile>({
  profileId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  mode: { type: String, default: 'dark' },
  accentColor: { type: String, default: '#D4AF37' },
  fontFamily: { type: String, default: 'system' },
  animationScale: { type: Number, default: 1 },
  blurIntensity: { type: Number, default: 0.6 },
  isActive: { type: Boolean, default: false },
  ...auditSchemaFields,
}, { timestamps: true });

export const ThemeProfile = mongoose.model<IThemeProfile>('ThemeProfile', themeProfileSchema);

export interface IWallpaperPack extends Document {
  packId: string;
  userId: Types.ObjectId;
  name: string;
  type: WallpaperType;
  wallpapers: { id: string; url?: string; gradient?: string; thumbnail?: string }[];
  isActive: boolean;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const wallpaperPackSchema = new Schema<IWallpaperPack>({
  packId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, default: 'gradient' },
  wallpapers: [{ id: String, url: String, gradient: String, thumbnail: String }],
  isActive: { type: Boolean, default: false },
  ...auditSchemaFields,
}, { timestamps: true });

export const WallpaperPack = mongoose.model<IWallpaperPack>('WallpaperPack', wallpaperPackSchema);

export interface IHomeLayout extends Document {
  layoutId: string;
  userId: Types.ObjectId;
  name: string;
  pages: { pageIndex: number; apps: { bundleId: string; position: number }[] }[];
  dockApps: string[];
  hiddenApps: string[];
  iconSize: IconSize;
  gridColumns: number;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const homeLayoutSchema = new Schema<IHomeLayout>({
  layoutId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  pages: [{ pageIndex: Number, apps: [{ bundleId: String, position: Number }] }],
  dockApps: { type: [String], default: [] },
  hiddenApps: { type: [String], default: [] },
  iconSize: { type: String, default: 'medium' },
  gridColumns: { type: Number, default: 4 },
  isActive: { type: Boolean, default: false },
  ...auditSchemaFields,
}, { timestamps: true });

export const HomeLayout = mongoose.model<IHomeLayout>('HomeLayout', homeLayoutSchema);

export interface ILockScreenProfile extends Document {
  profileId: string;
  userId: Types.ObjectId;
  name: string;
  clockStyle: string;
  clockFont: string;
  clockColor: string;
  wallpaperPackId?: string;
  widgets: { type: string; position: string }[];
  showNotifications: boolean;
  showMusicPlayer: boolean;
  alwaysOnDisplay: boolean;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const lockScreenWidgetSchema = new Schema(
  {
    type: { type: String, required: true },
    position: { type: String, required: true },
  },
  { _id: false }
);

const lockScreenProfileSchema = new Schema<ILockScreenProfile>({
  profileId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  clockStyle: { type: String, default: 'digital' },
  clockFont: { type: String, default: 'default' },
  clockColor: { type: String, default: '#FFFFFF' },
  wallpaperPackId: String,
  widgets: { type: [lockScreenWidgetSchema], default: [] },
  showNotifications: { type: Boolean, default: true },
  showMusicPlayer: { type: Boolean, default: true },
  alwaysOnDisplay: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  ...auditSchemaFields,
}, { timestamps: true });

export const LockScreenProfile = mongoose.model<ILockScreenProfile>('LockScreenProfile', lockScreenProfileSchema);

export interface IContinuitySession extends Document {
  sessionId: string;
  userId: Types.ObjectId;
  sourceDeviceId: string;
  targetDeviceId?: string;
  type: 'handoff' | 'clipboard' | 'call' | 'navigation' | 'media';
  payload: Record<string, unknown>;
  status: 'active' | 'completed' | 'expired';
  expiresAt: Date;
  createdAt: Date;
}

const continuitySessionSchema = new Schema<IContinuitySession>({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sourceDeviceId: { type: String, required: true },
  targetDeviceId: String,
  type: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, default: 'active' },
  expiresAt: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const ContinuitySession = mongoose.model<IContinuitySession>('ContinuitySession', continuitySessionSchema);

export interface IClipboardSession extends Document {
  sessionId: string;
  userId: Types.ObjectId;
  content: string;
  contentType: 'text' | 'image' | 'file' | 'url';
  sourceDeviceId: string;
  syncedDevices: string[];
  expiresAt: Date;
  createdAt: Date;
}

const clipboardSessionSchema = new Schema<IClipboardSession>({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true },
  contentType: { type: String, default: 'text' },
  sourceDeviceId: { type: String, required: true },
  syncedDevices: { type: [String], default: [] },
  expiresAt: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const ClipboardSession = mongoose.model<IClipboardSession>('ClipboardSession', clipboardSessionSchema);
