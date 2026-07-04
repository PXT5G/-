import { Types } from 'mongoose';
import { z } from 'zod';
import { getTranslations } from '@bananaos/shared';
import { UserSettings, type IUserSettings } from '../database/models/UserSettings';
import { DeviceProfile } from '../database/models/DeviceProfile';
import { DeviceState } from '../database/models/DeviceState';
import { NetworkState } from '../database/models/NetworkState';
import {
  SUPPORTED_LANGUAGES, DEFAULT_USER_SETTINGS, DEVICE_INFO,
  DATE_FORMATS, TIME_FORMATS, TEMPERATURE_UNITS, DISTANCE_UNITS,
  CURRENCIES, KEYBOARD_LAYOUTS, DISPLAY_ZOOM_LEVELS, REFRESH_RATES,
} from '../constants/settings';
import { logAudit } from './auditService';
import { emitToUser } from './socketService';
import { updateNetworkSettings } from './networkService';
import { setPowerMode } from './powerSystemService';
import { updateDeviceProfile } from './deviceProfileService';

const wallpaperSchema = z.object({
  id: z.string(),
  type: z.enum(['gradient', 'image', 'animated']),
  light: z.string().optional(),
  dark: z.string().optional(),
  url: z.string().optional(),
  animatedClass: z.string().optional(),
}).optional();

export const settingsUpdateSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  accentColor: z.enum(['gold', 'white', 'black']).optional(),
  wallpaper: wallpaperSchema,
  language: z.string().refine((c) => SUPPORTED_LANGUAGES.some((l) => l.code === c)).optional(),
  region: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.enum(DATE_FORMATS as unknown as [string, ...string[]]).optional(),
  timeFormat: z.enum(TIME_FORMATS as unknown as [string, ...string[]]).optional(),
  temperatureUnit: z.enum(TEMPERATURE_UNITS as unknown as [string, ...string[]]).optional(),
  distanceUnit: z.enum(DISTANCE_UNITS as unknown as [string, ...string[]]).optional(),
  currency: z.enum(CURRENCIES as unknown as [string, ...string[]]).optional(),
  keyboardLayout: z.enum(KEYBOARD_LAYOUTS as unknown as [string, ...string[]]).optional(),
  reduceMotion: z.boolean().optional(),
  highContrast: z.boolean().optional(),
  fontSize: z.enum(['small', 'medium', 'large']).optional(),
  hapticsEnabled: z.boolean().optional(),
  soundsEnabled: z.boolean().optional(),
  brightness: z.number().min(0).max(100).optional(),
  volume: z.number().min(0).max(100).optional(),
  wifiEnabled: z.boolean().optional(),
  bluetoothEnabled: z.boolean().optional(),
  silentMode: z.boolean().optional(),
  rotationLock: z.boolean().optional(),
  flashlightEnabled: z.boolean().optional(),
  autoTheme: z.boolean().optional(),
  displayZoom: z.enum(DISPLAY_ZOOM_LEVELS as unknown as [string, ...string[]]).optional(),
  animationsEnabled: z.boolean().optional(),
  autoBrightness: z.boolean().optional(),
  refreshRate: z.union([z.literal(60), z.literal(90), z.literal(120)]).optional(),
  screenTimeout: z.number().optional(),
  alwaysOnDisplay: z.boolean().optional(),
  mediaVolume: z.number().min(0).max(100).optional(),
  callVolume: z.number().min(0).max(100).optional(),
  notificationVolume: z.number().min(0).max(100).optional(),
  alarmVolume: z.number().min(0).max(100).optional(),
  vibrationEnabled: z.boolean().optional(),
  ringtone: z.string().optional(),
  notificationSound: z.string().optional(),
  keyboardSound: z.boolean().optional(),
  mobileDataEnabled: z.boolean().optional(),
  hotspotEnabled: z.boolean().optional(),
  airplaneMode: z.boolean().optional(),
  powerSavingMode: z.boolean().optional(),
  lowPowerMode: z.boolean().optional(),
  voiceOverEnabled: z.boolean().optional(),
  largeText: z.boolean().optional(),
  boldText: z.boolean().optional(),
  colorFilters: z.boolean().optional(),
  monoAudio: z.boolean().optional(),
  touchAssistance: z.boolean().optional(),
  developerModeEnabled: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  appLockEnabled: z.boolean().optional(),
  defaultApps: z.record(z.string()).optional(),
  dockApps: z.array(z.string()).optional(),
}).strict();

export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;

export function formatSettings(settings: InstanceType<typeof UserSettings>) {
  const doc = settings.toObject();
  return {
    theme: doc.theme,
    accentColor: doc.accentColor,
    wallpaper: doc.wallpaper,
    language: doc.language,
    region: doc.region,
    timezone: doc.timezone,
    dateFormat: doc.dateFormat,
    timeFormat: doc.timeFormat,
    temperatureUnit: doc.temperatureUnit,
    distanceUnit: doc.distanceUnit,
    currency: doc.currency,
    keyboardLayout: doc.keyboardLayout,
    reduceMotion: doc.reduceMotion,
    highContrast: doc.highContrast,
    fontSize: doc.fontSize,
    hapticsEnabled: doc.hapticsEnabled,
    soundsEnabled: doc.soundsEnabled,
    brightness: doc.brightness,
    volume: doc.volume,
    wifiEnabled: doc.wifiEnabled,
    bluetoothEnabled: doc.bluetoothEnabled,
    silentMode: doc.silentMode,
    rotationLock: doc.rotationLock,
    flashlightEnabled: doc.flashlightEnabled,
    autoTheme: doc.autoTheme,
    displayZoom: doc.displayZoom,
    animationsEnabled: doc.animationsEnabled,
    autoBrightness: doc.autoBrightness,
    refreshRate: doc.refreshRate,
    screenTimeout: doc.screenTimeout,
    alwaysOnDisplay: doc.alwaysOnDisplay,
    mediaVolume: doc.mediaVolume,
    callVolume: doc.callVolume,
    notificationVolume: doc.notificationVolume,
    alarmVolume: doc.alarmVolume,
    vibrationEnabled: doc.vibrationEnabled,
    ringtone: doc.ringtone,
    notificationSound: doc.notificationSound,
    keyboardSound: doc.keyboardSound,
    mobileDataEnabled: doc.mobileDataEnabled,
    hotspotEnabled: doc.hotspotEnabled,
    airplaneMode: doc.airplaneMode,
    powerSavingMode: doc.powerSavingMode,
    lowPowerMode: doc.lowPowerMode,
    voiceOverEnabled: doc.voiceOverEnabled,
    largeText: doc.largeText,
    boldText: doc.boldText,
    colorFilters: doc.colorFilters,
    monoAudio: doc.monoAudio,
    touchAssistance: doc.touchAssistance,
    developerModeEnabled: doc.developerModeEnabled,
    twoFactorEnabled: doc.twoFactorEnabled,
    appLockEnabled: doc.appLockEnabled,
    defaultApps: doc.defaultApps,
    dockApps: doc.dockApps,
    updatedAt: (settings as IUserSettings & { updatedAt?: Date }).updatedAt?.toISOString(),
  };
}

export async function getUserSettings(userId: string) {
  let settings = await UserSettings.findOne({ userId });
  if (!settings) {
    settings = await UserSettings.create({ userId: new Types.ObjectId(userId), ...DEFAULT_USER_SETTINGS });
  }
  return formatSettings(settings);
}

export async function updateUserSettings(userId: string, updates: SettingsUpdate, actorId: string) {
  const parsed = settingsUpdateSchema.parse(updates);
  const settings = await UserSettings.findOneAndUpdate(
    { userId },
    { $set: parsed },
    { new: true, upsert: true }
  );

  await applySettingsSideEffects(userId, parsed, actorId);

  await logAudit({
    userId,
    actorId,
    action: 'settings_update',
    resource: 'settings',
    metadata: { fields: Object.keys(parsed) },
  });

  const data = formatSettings(settings);
  emitToUser(userId, 'settings:updated', data);
  return data;
}

async function applySettingsSideEffects(userId: string, updates: SettingsUpdate, actorId: string) {
  if (updates.brightness !== undefined || updates.alwaysOnDisplay !== undefined || updates.screenTimeout !== undefined) {
    await DeviceState.findOneAndUpdate(
      { userId },
      {
        ...(updates.brightness !== undefined ? { brightness: updates.brightness } : {}),
        ...(updates.alwaysOnDisplay !== undefined ? { alwaysOnDisplay: updates.alwaysOnDisplay } : {}),
      },
      { upsert: true }
    );
  }

  if (updates.wifiEnabled !== undefined || updates.bluetoothEnabled !== undefined || updates.airplaneMode !== undefined || updates.hotspotEnabled !== undefined || updates.mobileDataEnabled !== undefined) {
    const networkUpdates: Parameters<typeof updateNetworkSettings>[1] = {};
    if (updates.airplaneMode) {
      networkUpdates.wifiEnabled = false;
      networkUpdates.bluetoothEnabled = false;
    } else {
      if (updates.wifiEnabled !== undefined) networkUpdates.wifiEnabled = updates.wifiEnabled;
      if (updates.bluetoothEnabled !== undefined) networkUpdates.bluetoothEnabled = updates.bluetoothEnabled;
    }
    if (Object.keys(networkUpdates).length > 0) {
      await updateNetworkSettings(userId, networkUpdates, actorId).catch(() => {});
    }
    if (updates.airplaneMode !== undefined || updates.mobileDataEnabled !== undefined) {
      await NetworkState.findOneAndUpdate(
        { userId },
        {
          ...(updates.airplaneMode !== undefined ? { internetConnected: !updates.airplaneMode, connectionState: updates.airplaneMode ? 'disconnected' : 'connected' } : {}),
        },
        { upsert: true }
      ).catch(() => {});
    }
  }

  if (updates.powerSavingMode !== undefined || updates.lowPowerMode !== undefined) {
    const mode = updates.lowPowerMode ? 'low_power' : updates.powerSavingMode ? 'low_power' : 'normal';
    await setPowerMode(userId, mode, actorId).catch(() => {});
  }

  if (updates.language !== undefined || updates.region !== undefined || updates.timezone !== undefined) {
    await updateDeviceProfile(userId, {
      language: updates.language,
      region: updates.region,
      timezone: updates.timezone,
    }, actorId).catch(() => {});
    await DeviceProfile.findOneAndUpdate({ userId }, { deviceName: DEVICE_INFO.defaultDeviceName }).catch(() => {});
  }

  if (updates.silentMode !== undefined) {
    await DeviceState.findOneAndUpdate({ userId }, { silentMode: updates.silentMode }, { upsert: true });
  }
}

export async function resetUserSettings(userId: string, actorId: string) {
  await UserSettings.deleteOne({ userId });
  const settings = await UserSettings.create({ userId: new Types.ObjectId(userId), ...DEFAULT_USER_SETTINGS });
  await logAudit({ userId, actorId, action: 'settings_reset', resource: 'settings' });
  const data = formatSettings(settings);
  emitToUser(userId, 'settings:updated', data);
  return data;
}

export async function getDeviceAboutInfo(userId: string) {
  const profile = await DeviceProfile.findOne({ userId });
  const { getHardwareProfile } = await import('./hardwareService');
  const { getDeviceState } = await import('./deviceStateService');
  const hardware = await getHardwareProfile(userId);
  const state = await getDeviceState(userId).catch(() => null);

  const storageTotal = hardware.internalStorage;
  const storageUsed = state?.storageUsed ?? Math.floor(storageTotal * 0.35);
  const ramTotal = hardware.ramTotal;
  const ramUsed = state?.ramUsed ?? Math.floor(ramTotal * 0.4);

  return {
    model: DEVICE_INFO.model,
    deviceName: profile?.deviceName ?? DEVICE_INFO.defaultDeviceName,
    developer: DEVICE_INFO.developer,
    manufacturer: DEVICE_INFO.manufacturer,
    operatingSystem: DEVICE_INFO.operatingSystem,
    kernel: DEVICE_INFO.kernel,
    hardwareVersion: DEVICE_INFO.hardwareVersion,
    buildNumber: DEVICE_INFO.buildNumber,
    osVersion: profile?.osVersion ?? DEVICE_INFO.osVersion,
    deviceUuid: hardware.deviceUuid,
    serialNumber: hardware.serialNumber,
    storage: { total: storageTotal, used: storageUsed, free: storageTotal - storageUsed },
    ram: { total: ramTotal, used: ramUsed },
    cpu: hardware.cpu,
    gpu: hardware.gpu,
    batteryHealth: profile?.batteryHealthPercent ?? 100,
    imei: profile?.serialNumber ? `35${profile.serialNumber.slice(0, 13)}` : undefined,
    generation: hardware.generation,
    deviceModel: hardware.deviceModel,
    deviceColor: hardware.deviceColor,
  };
}

export function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

export function getTranslationsForLanguage(code: string) {
  return getTranslations(code);
}
