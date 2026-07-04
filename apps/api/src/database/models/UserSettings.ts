import mongoose, { Schema, Document } from 'mongoose';
import type { ThemeMode, AccentColor, WallpaperConfig } from '@gulfos/shared';
import { DEFAULT_USER_SETTINGS } from '../../constants/settings';

export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;
  theme: ThemeMode;
  accentColor: AccentColor;
  wallpaper: WallpaperConfig;
  language: string;
  region: string;
  timezone: string;
  dateFormat: 'mdy' | 'dmy' | 'ymd';
  timeFormat: '12h' | '24h';
  temperatureUnit: 'celsius' | 'fahrenheit';
  distanceUnit: 'km' | 'mi';
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
  displayZoom: 'default' | 'large' | 'larger';
  animationsEnabled: boolean;
  autoBrightness: boolean;
  refreshRate: 60 | 90 | 120;
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
  defaultApps: Record<string, string>;
  dockApps: string[];
}

const userSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: DEFAULT_USER_SETTINGS.theme },
    accentColor: { type: String, enum: ['gold', 'white', 'black'], default: DEFAULT_USER_SETTINGS.accentColor },
    wallpaper: {
      id: { type: String, default: 'gulf-gradient' },
      type: { type: String, enum: ['gradient', 'image', 'animated'], default: 'animated' },
      light: { type: String },
      dark: { type: String },
      url: { type: String },
      animatedClass: { type: String, default: 'wallpaper-gulf' },
    },
    language: { type: String, default: DEFAULT_USER_SETTINGS.language },
    region: { type: String, default: DEFAULT_USER_SETTINGS.region },
    timezone: { type: String, default: DEFAULT_USER_SETTINGS.timezone },
    dateFormat: { type: String, enum: ['mdy', 'dmy', 'ymd'], default: DEFAULT_USER_SETTINGS.dateFormat },
    timeFormat: { type: String, enum: ['12h', '24h'], default: DEFAULT_USER_SETTINGS.timeFormat },
    temperatureUnit: { type: String, enum: ['celsius', 'fahrenheit'], default: DEFAULT_USER_SETTINGS.temperatureUnit },
    distanceUnit: { type: String, enum: ['km', 'mi'], default: DEFAULT_USER_SETTINGS.distanceUnit },
    currency: { type: String, default: DEFAULT_USER_SETTINGS.currency },
    keyboardLayout: { type: String, enum: ['qwerty', 'azerty', 'qwertz', 'arabic'], default: DEFAULT_USER_SETTINGS.keyboardLayout },
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
    autoTheme: { type: Boolean, default: DEFAULT_USER_SETTINGS.autoTheme },
    displayZoom: { type: String, enum: ['default', 'large', 'larger'], default: DEFAULT_USER_SETTINGS.displayZoom },
    animationsEnabled: { type: Boolean, default: DEFAULT_USER_SETTINGS.animationsEnabled },
    autoBrightness: { type: Boolean, default: DEFAULT_USER_SETTINGS.autoBrightness },
    refreshRate: { type: Number, enum: [60, 90, 120], default: DEFAULT_USER_SETTINGS.refreshRate },
    screenTimeout: { type: Number, default: DEFAULT_USER_SETTINGS.screenTimeout },
    alwaysOnDisplay: { type: Boolean, default: DEFAULT_USER_SETTINGS.alwaysOnDisplay },
    mediaVolume: { type: Number, default: DEFAULT_USER_SETTINGS.mediaVolume, min: 0, max: 100 },
    callVolume: { type: Number, default: DEFAULT_USER_SETTINGS.callVolume, min: 0, max: 100 },
    notificationVolume: { type: Number, default: DEFAULT_USER_SETTINGS.notificationVolume, min: 0, max: 100 },
    alarmVolume: { type: Number, default: DEFAULT_USER_SETTINGS.alarmVolume, min: 0, max: 100 },
    vibrationEnabled: { type: Boolean, default: DEFAULT_USER_SETTINGS.vibrationEnabled },
    ringtone: { type: String, default: DEFAULT_USER_SETTINGS.ringtone },
    notificationSound: { type: String, default: DEFAULT_USER_SETTINGS.notificationSound },
    keyboardSound: { type: Boolean, default: DEFAULT_USER_SETTINGS.keyboardSound },
    mobileDataEnabled: { type: Boolean, default: DEFAULT_USER_SETTINGS.mobileDataEnabled },
    hotspotEnabled: { type: Boolean, default: DEFAULT_USER_SETTINGS.hotspotEnabled },
    airplaneMode: { type: Boolean, default: DEFAULT_USER_SETTINGS.airplaneMode },
    powerSavingMode: { type: Boolean, default: DEFAULT_USER_SETTINGS.powerSavingMode },
    lowPowerMode: { type: Boolean, default: false },
    voiceOverEnabled: { type: Boolean, default: DEFAULT_USER_SETTINGS.voiceOverEnabled },
    largeText: { type: Boolean, default: DEFAULT_USER_SETTINGS.largeText },
    boldText: { type: Boolean, default: DEFAULT_USER_SETTINGS.boldText },
    colorFilters: { type: Boolean, default: DEFAULT_USER_SETTINGS.colorFilters },
    monoAudio: { type: Boolean, default: DEFAULT_USER_SETTINGS.monoAudio },
    touchAssistance: { type: Boolean, default: DEFAULT_USER_SETTINGS.touchAssistance },
    developerModeEnabled: { type: Boolean, default: DEFAULT_USER_SETTINGS.developerModeEnabled },
    twoFactorEnabled: { type: Boolean, default: DEFAULT_USER_SETTINGS.twoFactorEnabled },
    appLockEnabled: { type: Boolean, default: DEFAULT_USER_SETTINGS.appLockEnabled },
    defaultApps: { type: Map, of: String, default: {} },
    dockApps: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', userSettingsSchema);
