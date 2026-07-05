import { Request, Response, NextFunction } from 'express';
import * as identityService from '../../services/identityService';

function actorId(req: Request): string {
  return (req as Request & { user?: { userId: string } }).user!.userId;
}

function userId(req: Request): string {
  return actorId(req);
}

export async function initialize(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await identityService.initializeIdentity(userId(req), actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function profile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await identityService.getProfile(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await identityService.updateProfile(userId(req), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function documents(req: Request, res: Response, next: NextFunction) {
  try {
    const { type } = req.query;
    const data = await identityService.listDocuments(userId(req), type as never);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function addDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await identityService.addDocument(userId(req), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function emergencyInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await identityService.getEmergencyInfo(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function updateEmergencyInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await identityService.updateEmergencyInfo(userId(req), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function generateQr(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await identityService.generateQrVerification(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function verifyQr(req: Request, res: Response, next: NextFunction) {
  try {
    const { qrCode } = req.body;
    const data = await identityService.verifyQr(qrCode);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function verifyBarcode(req: Request, res: Response, next: NextFunction) {
  try {
    const { barcode } = req.body;
    const data = await identityService.verifyBarcode(barcode);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function exportVCard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await identityService.exportVCard(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, limit } = req.query;
    const data = await identityService.searchIdentities(q as string, limit ? parseInt(limit as string, 10) : undefined);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
