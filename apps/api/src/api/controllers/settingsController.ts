import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { getActorId } from '../../services/rbacService';
import {
  getUserSettings,
  updateUserSettings,
  resetUserSettings,
  getDeviceAboutInfo,
  getSupportedLanguages,
  getTranslationsForLanguage,
  settingsUpdateSchema,
} from '../../services/settingsService';

export const getSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getUserSettings(req.user!.userId);
  res.json({ success: true, data });
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = settingsUpdateSchema.parse(req.body ?? {});
  const data = await updateUserSettings(req.user!.userId, body, getActorId(req));
  res.json({ success: true, data });
});

export const resetSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await resetUserSettings(req.user!.userId, getActorId(req));
  res.json({ success: true, data });
});

export const listLanguages = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: getSupportedLanguages() });
});

export const getAbout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getDeviceAboutInfo(req.user!.userId);
  res.json({ success: true, data });
});

export const getTranslations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const code = String(req.params.code ?? 'en');
  const data = getTranslationsForLanguage(code);
  res.json({ success: true, data: { code, translations: data } });
});
