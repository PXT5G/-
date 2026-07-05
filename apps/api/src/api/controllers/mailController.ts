import { Request, Response, NextFunction } from 'express';
import * as mailService from '../../services/mailService';

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
    const data = await mailService.initializeMail(userId(req), actorId(req), req.body.email);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function listAccounts(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await mailService.listAccounts(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function listMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const folder = (req.query.folder as string) ?? 'inbox';
    const data = await mailService.listMessages(userId(req), folder as never, {
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      search: req.query.search as string,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function send(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await mailService.sendMail(userId(req), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await mailService.updateMessage(userId(req), paramId(req.params.id), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await mailService.deleteMessage(userId(req), paramId(req.params.id), actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await mailService.searchMail(userId(req), req.query.q as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
