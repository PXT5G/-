import { Request, Response, NextFunction } from 'express';
import * as simService from '../../services/simService';

function actorId(req: Request): string {
  return (req as Request & { user?: { userId: string } }).user!.userId;
}

function userId(req: Request): string {
  return actorId(req);
}

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export async function initialize(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await simService.initializeSim(userId(req), actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await simService.listSims(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await simService.getSim(userId(req), paramId(req.params.id));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await simService.updateSim(userId(req), paramId(req.params.id), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    await simService.refreshSimStatus(userId(req));
    const data = await simService.listSims(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
