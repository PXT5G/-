import { Request, Response, NextFunction } from 'express';
import * as personalizationService from '../../services/personalizationService';

function actorId(req: Request): string { return (req as Request & { user?: { userId: string } }).user!.userId; }
function userId(req: Request): string { return actorId(req); }
function paramId(v: string | string[]): string { return Array.isArray(v) ? v[0] : v; }

export async function initialize(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await personalizationService.initializePersonalization(userId(req), actorId(req)) }); }
  catch (err) { next(err); }
}

export async function themes(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await personalizationService.getThemes(userId(req)) }); }
  catch (err) { next(err); }
}

export async function activateTheme(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await personalizationService.activateTheme(userId(req), paramId(req.params.id), actorId(req)) }); }
  catch (err) { next(err); }
}

export async function wallpapers(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await personalizationService.getWallpaperPacks(userId(req)) }); }
  catch (err) { next(err); }
}

export async function layouts(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await personalizationService.getHomeLayouts(userId(req)) }); }
  catch (err) { next(err); }
}

export async function updateLayout(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await personalizationService.updateHomeLayout(userId(req), paramId(req.params.id), req.body, actorId(req)) }); }
  catch (err) { next(err); }
}

export async function lockScreenProfiles(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await personalizationService.getLockScreenProfiles(userId(req)) }); }
  catch (err) { next(err); }
}

export async function activateLockScreen(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await personalizationService.activateLockScreenProfile(userId(req), paramId(req.params.id), actorId(req)) }); }
  catch (err) { next(err); }
}

export async function startHandoff(req: Request, res: Response, next: NextFunction) {
  try {
    const { sourceDeviceId, type, payload } = req.body as { sourceDeviceId: string; type: string; payload?: Record<string, unknown> };
    res.json({ success: true, data: await personalizationService.startHandoff(userId(req), sourceDeviceId, type, payload ?? {}) });
  } catch (err) { next(err); }
}

export async function syncClipboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { sourceDeviceId, content, contentType } = req.body as { sourceDeviceId: string; content: string; contentType?: string };
    res.json({ success: true, data: await personalizationService.syncClipboard(userId(req), sourceDeviceId, content, contentType) });
  } catch (err) { next(err); }
}

export async function getClipboard(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await personalizationService.getClipboard(userId(req)) }); }
  catch (err) { next(err); }
}

export async function performanceSnapshot(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await personalizationService.getPerformanceSnapshot(userId(req)) }); }
  catch (err) { next(err); }
}
