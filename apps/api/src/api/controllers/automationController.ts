import { Request, Response, NextFunction } from 'express';
import * as automationService from '../../services/automationService';

function actorId(req: Request): string { return (req as Request & { user?: { userId: string } }).user!.userId; }
function userId(req: Request): string { return actorId(req); }
function paramId(v: string | string[]): string { return Array.isArray(v) ? v[0] : v; }

export async function initialize(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await automationService.initializeAutomation(userId(req), actorId(req)) }); }
  catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await automationService.listAutomations(userId(req), req.query.status as never) });
  } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await automationService.getAutomation(userId(req), paramId(req.params.id)) });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await automationService.createAutomation(userId(req), req.body, actorId(req)) });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await automationService.updateAutomation(userId(req), paramId(req.params.id), req.body, actorId(req)) });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await automationService.deleteAutomation(userId(req), paramId(req.params.id), actorId(req)) });
  } catch (err) { next(err); }
}

export async function run(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await automationService.runAutomation(userId(req), paramId(req.params.id), actorId(req)) });
  } catch (err) { next(err); }
}

export async function activate(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await automationService.activateAutomation(userId(req), paramId(req.params.id), actorId(req)) });
  } catch (err) { next(err); }
}

export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    res.json({ success: true, data: await automationService.getRunHistory(userId(req), req.query.automationId as string, limit) });
  } catch (err) { next(err); }
}
