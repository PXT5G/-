import { Request, Response, NextFunction } from 'express';
import * as phoneService from '../../services/phoneService';
import * as callEngine from '../../services/callEngineService';

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
    const data = await phoneService.initializePhone(userId(req), actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getCalls(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, limit, offset, search } = req.query;
    const data = await phoneService.getCallHistory(userId(req), {
      status: status as never,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
      search: search as string,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function initiateCall(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneService.initiateCall(userId(req), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function answerCall(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneService.answerCall(userId(req), paramId(req.params.id), actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function endCall(req: Request, res: Response, next: NextFunction) {
  try {
    const status = (req.body.status as string) ?? 'ended';
    const data = await phoneService.endCall(userId(req), paramId(req.params.id), status as never, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function updateCall(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneService.updateCallState(userId(req), paramId(req.params.id), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneService.getCallStatistics(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getFavorites(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneService.listFavorites(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function addFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneService.addFavorite(userId(req), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function removeFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneService.removeFavorite(userId(req), paramId(req.params.id), actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getBlocked(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneService.listBlockedNumbers(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function blockNumber(req: Request, res: Response, next: NextFunction) {
  try {
    const { number, reason } = req.body;
    const data = await phoneService.blockNumber(userId(req), number, reason, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function unblockNumber(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneService.unblockNumber(userId(req), paramId(req.params.id));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getVoicemail(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneService.listVoicemail(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function markVoicemailRead(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneService.markVoicemailRead(userId(req), paramId(req.params.id));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getDirectory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneService.getGovernmentDirectory();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function exportCalls(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await phoneService.exportCallHistory(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function simulateIncoming(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await callEngine.simulateIncomingCall(userId(req), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
