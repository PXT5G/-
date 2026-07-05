import { Request, Response, NextFunction } from 'express';
import * as phase55Service from '../../services/phase55Service';

function actorId(req: Request): string { return (req as Request & { user?: { userId: string } }).user!.userId; }
function userId(req: Request): string { return actorId(req); }
function paramId(v: string | string[]): string { return Array.isArray(v) ? v[0] : v; }

export async function initializeSecurity(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await phase55Service.initializeSecurity(userId(req), actorId(req)) }); }
  catch (err) { next(err); }
}

export async function securityDashboard(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await phase55Service.getSecurityDashboard(userId(req)) }); }
  catch (err) { next(err); }
}

export async function privacyDashboard(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await phase55Service.getPrivacyDashboard(userId(req)) }); }
  catch (err) { next(err); }
}

export async function createBackup(req: Request, res: Response, next: NextFunction) {
  try {
    const { backupType } = req.body as { backupType?: string };
    res.json({ success: true, data: await phase55Service.createBackup(userId(req), backupType ?? 'manual', actorId(req)) });
  } catch (err) { next(err); }
}

export async function listBackups(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await phase55Service.listBackups(userId(req)) }); }
  catch (err) { next(err); }
}

export async function restoreBackup(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await phase55Service.restoreBackup(userId(req), paramId(req.params.id), actorId(req)) }); }
  catch (err) { next(err); }
}

export async function syncCloud(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await phase55Service.syncCloud(userId(req), actorId(req)) }); }
  catch (err) { next(err); }
}

export async function registerDevice(req: Request, res: Response, next: NextFunction) {
  try {
    const { deviceType, deviceName } = req.body as { deviceType: string; deviceName: string };
    res.json({ success: true, data: await phase55Service.registerFindMyDevice(userId(req), deviceType, deviceName) });
  } catch (err) { next(err); }
}

export async function listDevices(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await phase55Service.listFindMyDevices(userId(req)) }); }
  catch (err) { next(err); }
}

export async function markDeviceLost(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await phase55Service.markDeviceLost(userId(req), paramId(req.params.id)) }); }
  catch (err) { next(err); }
}

export async function checkUpdates(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await phase55Service.checkForUpdates(userId(req)) }); }
  catch (err) { next(err); }
}

export async function getUpdateChannel(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await phase55Service.getUpdateChannel(userId(req)) }); }
  catch (err) { next(err); }
}

export async function developerDashboard(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await phase55Service.getDeveloperDashboard(userId(req)) }); }
  catch (err) { next(err); }
}

export async function analyticsCenter(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await phase55Service.getAnalyticsCenter(userId(req)) }); }
  catch (err) { next(err); }
}

export async function diagnosticsCenter(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await phase55Service.getDiagnosticsCenter(userId(req)) }); }
  catch (err) { next(err); }
}

export async function listEnterpriseOrgs(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await phase55Service.listEnterpriseOrgs(userId(req)) }); }
  catch (err) { next(err); }
}

export async function createEnterpriseOrg(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.body as { name: string };
    res.json({ success: true, data: await phase55Service.createEnterpriseOrg(userId(req), name, actorId(req)) });
  } catch (err) { next(err); }
}
