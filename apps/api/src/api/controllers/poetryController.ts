import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getActorId } from '../../services/rbacService';
import {
  POETRY_ROLES,
  POETRY_CATEGORIES,
  POEM_STATUSES,
  MODERATION_ACTIONS,
  EVENT_TYPES,
} from '../../constants/poetry';
import * as poetryService from '../../services/poetryService';

function mapError(err: unknown): never {
  if (!(err instanceof Error)) throw err;
  const map: Record<string, [number, string]> = {
    PERMISSION_DENIED: [403, 'Permission denied'],
    NOT_A_POET: [403, 'Not registered as poet'],
    APP_NOT_INSTALLED: [403, 'Poetry app not installed'],
    POEM_NOT_FOUND: [404, 'Poem not found'],
    PROFILE_NOT_FOUND: [404, 'Profile not found'],
    NO_POEMS: [404, 'No poems available'],
    CANNOT_FOLLOW_SELF: [400, 'Cannot follow yourself'],
    USER_NOT_FOUND: [404, 'User not found'],
  };
  const entry = map[err.message];
  if (entry) throw new AppError(entry[0], entry[1]);
  throw err;
}

function clientMeta(req: AuthRequest) {
  return {
    ipAddress: req.ip,
    deviceUuid: req.headers['x-device-uuid'] as string | undefined,
  };
}

export const initialize = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.initializePoetry(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const home = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.getHomeFeed(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const random = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.getRandomPoem(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const listPoems = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.listPoems(req.user!.userId, req.user!.role, {
      category: req.query.category as string,
      status: req.query.status as string,
      authorId: req.query.authorId as string,
      featured: req.query.featured === 'true',
      mine: req.query.mine === 'true',
    });
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

function paramId(req: { params: Record<string, string | string[] | undefined> }, key: string): string {
  return String(req.params[key]);
}

export const getPoem = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.getPoem(req.user!.userId, paramId(req, 'poemId'), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createPoem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    title: z.string().min(1).max(200),
    content: z.string().optional(),
    markdown: z.string().optional(),
    category: z.enum(POETRY_CATEGORIES as unknown as [string, ...string[]]),
    tags: z.array(z.string()).optional(),
    coverImageUrl: z.string().optional(),
    audioUrl: z.string().optional(),
    videoUrl: z.string().optional(),
    backgroundMusicUrl: z.string().optional(),
    galleryImageIds: z.array(z.string()).optional(),
    status: z.enum(POEM_STATUSES as unknown as [string, ...string[]]).optional(),
    scheduledAt: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await poetryService.createPoem(req.user!.userId, req.user!.role, body as never, clientMeta(req));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updatePoem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().optional(),
    markdown: z.string().optional(),
    category: z.enum(POETRY_CATEGORIES as unknown as [string, ...string[]]).optional(),
    tags: z.array(z.string()).optional(),
    coverImageUrl: z.string().optional(),
    audioUrl: z.string().optional(),
    videoUrl: z.string().optional(),
    backgroundMusicUrl: z.string().optional(),
    galleryImageIds: z.array(z.string()).optional(),
    status: z.enum(POEM_STATUSES as unknown as [string, ...string[]]).optional(),
    scheduledAt: z.string().optional(),
    changeNote: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await poetryService.updatePoem(req.user!.userId, paramId(req, 'poemId'), req.user!.role, body as never, clientMeta(req));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const deletePoem = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.deletePoem(req.user!.userId, paramId(req, 'poemId'), req.user!.role, clientMeta(req));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const poemVersions = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.listPoemVersions(req.user!.userId, paramId(req, 'poemId'), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const exportPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.exportPoemPdf(req.user!.userId, paramId(req, 'poemId'), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.searchPoems(req.user!.userId, req.user!.role, {
      q: req.query.q as string,
      category: req.query.category as string,
      author: req.query.author as string,
      tag: req.query.tag as string,
      sort: req.query.sort as string,
    });
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const like = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.likePoem(req.user!.userId, paramId(req, 'poemId'), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const comments = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.listComments(req.user!.userId, paramId(req, 'poemId'), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const addComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    body: z.string().min(1).max(2000),
    parentId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await poetryService.addComment(req.user!.userId, paramId(req, 'poemId'), body.body, body.parentId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const bookmark = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.toggleBookmark(req.user!.userId, paramId(req, 'poemId'), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const favorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.toggleFavorite(req.user!.userId, paramId(req, 'poemId'), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const share = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ channel: z.string().default('internal') }).parse(req.body ?? {});
  try {
    const data = await poetryService.sharePoem(req.user!.userId, paramId(req, 'poemId'), body.channel, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const bookmarks = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.listBookmarks(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const favorites = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.listFavorites(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const history = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.listHistory(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const profile = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.getProfile(paramId(req, 'userId'), req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    displayName: z.string().min(1).max(100).optional(),
    bio: z.string().max(2000).optional(),
    avatarUrl: z.string().optional(),
    coverImageUrl: z.string().optional(),
    website: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await poetryService.updateProfile(req.user!.userId, body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const follow = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.followPoet(req.user!.userId, paramId(req, 'userId'), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const verifiedPoets = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.listVerifiedPoets(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const collections = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.listCollections(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createCollection = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    title: z.string().min(1).max(120),
    description: z.string().optional(),
    isPublic: z.boolean().optional(),
    poemIds: z.array(z.string()).optional(),
  }).parse(req.body ?? {});
  try {
    const data = await poetryService.createCollection(req.user!.userId, body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const events = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.listEvents(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    eventType: z.enum(EVENT_TYPES as unknown as [string, ...string[]]),
    startsAt: z.string(),
    endsAt: z.string().optional(),
    location: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await poetryService.createEvent(req.user!.userId, body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const competitions = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.listCompetitions(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const challenges = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.listChallenges(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const moderate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    action: z.enum(MODERATION_ACTIONS as unknown as [string, ...string[]]),
    reason: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await poetryService.moderatePoem(
      req.user!.userId, paramId(req, 'poemId'), body.action as never, body.reason, req.user!.role, clientMeta(req)
    );
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const moderationLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.listModerationLogs(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const analytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.getAnalytics(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const rbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.getRbac(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateRbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    role: z.enum(POETRY_ROLES as unknown as [string, ...string[]]),
    permissions: z.array(z.string()),
  }).parse(req.body ?? {});
  try {
    const data = await poetryService.updateRbac(req.user!.userId, body.role as never, body.permissions, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const announcement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    priority: z.enum(['low', 'normal', 'high']).optional(),
    pinned: z.boolean().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await poetryService.createAnnouncement(req.user!.userId, body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dailyPoem = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await poetryService.setDailyPoem(req.user!.userId, paramId(req, 'poemId'), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});
