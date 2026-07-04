import { Request, Response, NextFunction } from 'express';
import * as contactsService from '../../services/contactsService';

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
    const data = await contactsService.initializeContacts(userId(req), actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, favorite, search, limit, offset } = req.query;
    const data = await contactsService.listContacts(userId(req), {
      category: category as never,
      favorite: favorite === 'true' ? true : favorite === 'false' ? false : undefined,
      search: search as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await contactsService.getContact(userId(req), paramId(req.params.id));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await contactsService.createContact(userId(req), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await contactsService.updateContact(userId(req), paramId(req.params.id), req.body, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await contactsService.deleteContact(userId(req), paramId(req.params.id), actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function duplicates(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await contactsService.findDuplicates(userId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function merge(req: Request, res: Response, next: NextFunction) {
  try {
    const { primaryId, mergeIds } = req.body;
    const data = await contactsService.mergeContacts(userId(req), primaryId, mergeIds, actorId(req));
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
