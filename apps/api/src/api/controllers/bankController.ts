import { Request, Response, NextFunction } from 'express';
import * as bankService from '../../services/bankService';

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
    const data = await bankService.initializeBank(userId(req), actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function dashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bankService.getDashboard(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function accounts(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bankService.listAccounts(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bankService.getAccount(userId(req), paramId(req.params.id));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function cards(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bankService.listCards(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function freezeCard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bankService.freezeCard(userId(req), paramId(req.params.id), actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function unfreezeCard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bankService.unfreezeCard(userId(req), paramId(req.params.id), actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function transactions(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId, limit, offset, category, search } = req.query;
    const data = await bankService.listTransactions(userId(req), {
      accountId: accountId as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
      category: category as string,
      search: search as string,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function transfers(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit, offset, status } = req.query;
    const data = await bankService.listTransfers(userId(req), {
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
      status: status as string,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function internalTransfer(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bankService.internalTransfer(userId(req), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function externalTransfer(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bankService.externalTransfer(userId(req), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function qrPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bankService.qrPayment(userId(req), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function budget(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bankService.getBudget(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function analytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await bankService.getAnalytics(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
