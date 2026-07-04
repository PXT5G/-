import { Response } from 'express';
import { UserSettings } from '../../database/models/UserSettings';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { emitToUser } from '../../services/socketService';

export const getSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  let settings = await UserSettings.findOne({ userId: req.user!.userId });
  if (!settings) {
    settings = await UserSettings.create({ userId: req.user!.userId });
  }

  res.json({ success: true, data: formatSettings(settings) });
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await UserSettings.findOneAndUpdate(
    { userId: req.user!.userId },
    { $set: req.body },
    { new: true, upsert: true }
  );

  emitToUser(req.user!.userId, 'settings:updated', formatSettings(settings));

  res.json({ success: true, data: formatSettings(settings) });
});

export const resetSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  await UserSettings.deleteOne({ userId: req.user!.userId });
  const settings = await UserSettings.create({ userId: req.user!.userId });

  res.json({ success: true, data: formatSettings(settings) });
});

function formatSettings(settings: InstanceType<typeof UserSettings>) {
  return {
    theme: settings.theme,
    accentColor: settings.accentColor,
    wallpaper: settings.wallpaper,
    language: settings.language,
    reduceMotion: settings.reduceMotion,
    highContrast: settings.highContrast,
    fontSize: settings.fontSize,
    hapticsEnabled: settings.hapticsEnabled,
    soundsEnabled: settings.soundsEnabled,
    brightness: settings.brightness,
    volume: settings.volume,
    wifiEnabled: settings.wifiEnabled,
    bluetoothEnabled: settings.bluetoothEnabled,
    silentMode: settings.silentMode,
    rotationLock: settings.rotationLock,
    flashlightEnabled: settings.flashlightEnabled,
  };
}
