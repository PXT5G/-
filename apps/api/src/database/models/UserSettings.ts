import mongoose, { Schema, Document } from 'mongoose';
import type { ThemeMode, AccentColor, WallpaperConfig } from '@bananaos/shared';

export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;
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

const userSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    accentColor: { type: String, enum: ['gold', 'white', 'black'], default: 'gold' },
    wallpaper: {
      id: { type: String, default: 'banana-gradient' },
      type: { type: String, enum: ['gradient', 'image', 'animated'], default: 'animated' },
      light: { type: String },
      dark: { type: String },
      url: { type: String },
      animatedClass: { type: String, default: 'wallpaper-banana' },
    },
    language: { type: String, default: 'en' },
    reduceMotion: { type: Boolean, default: false },
    highContrast: { type: Boolean, default: false },
    fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    hapticsEnabled: { type: Boolean, default: true },
    soundsEnabled: { type: Boolean, default: true },
    brightness: { type: Number, default: 80, min: 0, max: 100 },
    volume: { type: Number, default: 70, min: 0, max: 100 },
    wifiEnabled: { type: Boolean, default: true },
    bluetoothEnabled: { type: Boolean, default: false },
    silentMode: { type: Boolean, default: false },
    rotationLock: { type: Boolean, default: false },
    flashlightEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', userSettingsSchema);
