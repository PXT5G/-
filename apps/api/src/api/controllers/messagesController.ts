import { Request, Response, NextFunction } from 'express';
import * as messagesService from '../../services/messagesAppService';

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
    const data = await messagesService.initializeMessages(userId(req), actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function listConversations(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await messagesService.listConversations(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const data = await messagesService.getSmsMessages(userId(req), paramId(req.params.conversationId), limit);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function send(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await messagesService.sendSms(userId(req), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await messagesService.searchMessages(userId(req), req.query.q as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function typing(req: Request, res: Response, next: NextFunction) {
  try {
    const { typing } = req.body;
    const data = await messagesService.setTyping(userId(req), paramId(req.params.conversationId), typing);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
