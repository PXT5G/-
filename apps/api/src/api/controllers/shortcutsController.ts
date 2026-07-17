import { Request, Response, NextFunction } from 'express';
import * as shortcutsService from '../../services/shortcutsService';

function actorId(req: Request): string { return (req as Request & { user?: { userId: string } }).user!.userId; }
function userId(req: Request): string { return actorId(req); }
function paramId(v: string | string[]): string { return Array.isArray(v) ? v[0] : v; }

export async function initialize(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await shortcutsService.initializeShortcuts(userId(req), actorId(req)) }); }
  catch (err) { next(err); }
}
export async function list(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await shortcutsService.listShortcuts(userId(req)) }); }
  catch (err) { next(err); }
}
export async function get(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await shortcutsService.getShortcut(userId(req), paramId(req.params.id)) }); }
  catch (err) { next(err); }
}
export async function create(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await shortcutsService.createShortcut(userId(req), req.body, actorId(req)) }); }
  catch (err) { next(err); }
}
export async function update(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await shortcutsService.updateShortcut(userId(req), paramId(req.params.id), req.body, actorId(req)) }); }
  catch (err) { next(err); }
}
export async function remove(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await shortcutsService.deleteShortcut(userId(req), paramId(req.params.id), actorId(req)) }); }
  catch (err) { next(err); }
}
export async function run(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await shortcutsService.runShortcut(userId(req), paramId(req.params.id), actorId(req)) }); }
  catch (err) { next(err); }
}
export async function history(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await shortcutsService.getShortcutHistory(userId(req)) }); }
  catch (err) { next(err); }
}
