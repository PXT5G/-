import { Request, Response, NextFunction } from 'express';
import * as focusService from '../../services/focusService';

function actorId(req: Request): string { return (req as Request & { user?: { userId: string } }).user!.userId; }
function userId(req: Request): string { return actorId(req); }
function paramId(v: string | string[]): string { return Array.isArray(v) ? v[0] : v; }

export async function initialize(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await focusService.initializeFocus(userId(req), actorId(req)) }); }
  catch (err) { next(err); }
}
export async function list(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await focusService.listProfiles(userId(req)) }); }
  catch (err) { next(err); }
}
export async function active(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await focusService.getActiveProfile(userId(req)) }); }
  catch (err) { next(err); }
}
export async function enable(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await focusService.enableFocus(userId(req), paramId(req.params.id), actorId(req)) }); }
  catch (err) { next(err); }
}
export async function disable(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await focusService.disableFocus(userId(req), actorId(req)) }); }
  catch (err) { next(err); }
}
export async function create(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await focusService.createProfile(userId(req), req.body, actorId(req)) }); }
  catch (err) { next(err); }
}
export async function update(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await focusService.updateProfile(userId(req), paramId(req.params.id), req.body, actorId(req)) }); }
  catch (err) { next(err); }
}
