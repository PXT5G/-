import { Request, Response, NextFunction } from 'express';
import * as assistantService from '../../services/assistantService';

function actorId(req: Request): string { return (req as Request & { user?: { userId: string } }).user!.userId; }
function userId(req: Request): string { return actorId(req); }
function paramId(v: string | string[]): string { return Array.isArray(v) ? v[0] : v; }

export async function initialize(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await assistantService.initializeAssistant(userId(req), actorId(req)) }); }
  catch (err) { next(err); }
}

export async function conversations(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    res.json({ success: true, data: await assistantService.listConversations(userId(req), limit) });
  } catch (err) { next(err); }
}

export async function createConversation(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await assistantService.createConversation(userId(req), req.body.title, actorId(req)) });
  } catch (err) { next(err); }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await assistantService.sendMessage(userId(req), paramId(req.params.id), req.body.content, actorId(req)) });
  } catch (err) { next(err); }
}

export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await assistantService.getConversationMessages(userId(req), paramId(req.params.id)) });
  } catch (err) { next(err); }
}

export async function deleteConversation(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await assistantService.deleteConversation(userId(req), paramId(req.params.id), actorId(req)) });
  } catch (err) { next(err); }
}

export async function confirmAction(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await assistantService.confirmAction(userId(req), paramId(req.params.id), actorId(req)) });
  } catch (err) { next(err); }
}
