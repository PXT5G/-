import { Request, Response, NextFunction } from 'express';
import * as intelligenceService from '../../services/intelligenceService';

function actorId(req: Request): string { return (req as Request & { user?: { userId: string } }).user!.userId; }
function userId(req: Request): string { return actorId(req); }
function paramId(v: string | string[]): string { return Array.isArray(v) ? v[0] : v; }

export async function initialize(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await intelligenceService.initializeIntelligence(userId(req), actorId(req)) }); }
  catch (err) { next(err); }
}
export async function predictions(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.query.generate === 'true'
      ? await intelligenceService.generatePredictions(userId(req))
      : await intelligenceService.getPredictions(userId(req), req.query.type as never);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
export async function suggestions(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.query.generate === 'true'
      ? await intelligenceService.generateSuggestions(userId(req))
      : await intelligenceService.getSuggestions(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
export async function dismissSuggestion(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await intelligenceService.dismissSuggestion(userId(req), paramId(req.params.id)) }); }
  catch (err) { next(err); }
}
export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, limit } = req.query;
    const data = await intelligenceService.searchIndex(userId(req), String(q ?? ''), limit ? parseInt(limit as string, 10) : undefined);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
export async function refreshIndex(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await intelligenceService.refreshSearchIndex(userId(req)) }); }
  catch (err) { next(err); }
}
export async function searchHistory(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await intelligenceService.getSearchHistory(userId(req)) }); }
  catch (err) { next(err); }
}
export async function dashboards(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await intelligenceService.getDashboards(userId(req)) }); }
  catch (err) { next(err); }
}
export async function refreshDashboard(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await intelligenceService.refreshDashboard(userId(req), paramId(req.params.id)) }); }
  catch (err) { next(err); }
}
export async function startVoice(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await intelligenceService.startVoiceSession(userId(req), req.body.language) }); }
  catch (err) { next(err); }
}
export async function voiceCommand(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await intelligenceService.processVoiceCommand(userId(req), req.body.sessionId, req.body.transcript) }); }
  catch (err) { next(err); }
}
export async function endVoice(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await intelligenceService.endVoiceSession(userId(req), req.body.sessionId) }); }
  catch (err) { next(err); }
}
export async function optimize(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await intelligenceService.runBackgroundOptimization(userId(req)) }); }
  catch (err) { next(err); }
}
