import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import {
  BROWSER_ROLES,
  DOWNLOAD_STATUSES,
  SEARCH_ENGINES,
  SITE_PERMISSION_TYPES,
} from '../../constants/browser';
import * as browserService from '../../services/browserService';

function mapError(err: unknown): never {
  if (!(err instanceof Error)) throw err;
  const map: Record<string, [number, string]> = {
    PERMISSION_DENIED: [403, 'Permission denied'],
    APP_NOT_INSTALLED: [403, 'Browser app not installed'],
    BROWSER_NOT_INITIALIZED: [404, 'Browser not initialized'],
    TAB_NOT_FOUND: [404, 'Tab not found'],
    SITE_NOT_FOUND: [404, 'Site not found'],
    HTTPS_REQUIRED: [400, 'HTTPS required'],
    DOWNLOAD_NOT_FOUND: [404, 'Download not found'],
    PASSWORD_NOT_FOUND: [404, 'Password not found'],
    BIOMETRIC_REQUIRED: [403, 'Biometric verification required'],
    PAGE_NOT_FOUND: [404, 'Offline page not found'],
    INVALID_PERMISSION: [400, 'Invalid site permission'],
    INSUFFICIENT_STORAGE: [507, 'Insufficient storage'],
    USER_NOT_FOUND: [404, 'User not found'],
  };
  const entry = map[err.message];
  if (entry) throw new AppError(entry[0], entry[1]);
  throw err;
}

function paramId(req: { params: Record<string, string | string[] | undefined> }, key: string): string {
  return String(req.params[key]);
}

function deviceUuid(req: AuthRequest) {
  return req.headers['x-device-uuid'] as string | undefined;
}

export const initialize = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.initializeBrowser(req.user!.userId, req.user!.role, deviceUuid(req));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const home = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.getBrowserHome(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const sites = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.listSites(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const navigate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    tabId: z.string().min(1),
    url: z.string().min(1),
    incognito: z.boolean().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await browserService.navigate(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '');
  try {
    const data = await browserService.searchSites(req.user!.userId, req.user!.role, q);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const searchSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const prefix = String(req.query.q ?? '');
  try {
    const data = await browserService.getSearchSuggestions(req.user!.userId, req.user!.role, prefix);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const searchHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.getSearchHistory(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const sessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.listSessions(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ incognito: z.boolean().default(false) }).parse(req.body ?? {});
  try {
    const data = await browserService.createSession(req.user!.userId, req.user!.role, body.incognito, deviceUuid(req));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const tabs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sessionId = String(req.query.sessionId ?? '');
  try {
    const data = await browserService.listTabs(req.user!.userId, sessionId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createTab = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ sessionId: z.string().min(1), url: z.string().optional() }).parse(req.body ?? {});
  try {
    const data = await browserService.createTab(req.user!.userId, req.user!.role, body.sessionId, body.url);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateTab = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    pinned: z.boolean().optional(),
    groupId: z.string().nullable().optional(),
    desktopMode: z.boolean().optional(),
    readerMode: z.boolean().optional(),
    orderIndex: z.number().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await browserService.updateTab(req.user!.userId, req.user!.role, paramId(req, 'tabId'), body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const closeTab = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.closeTab(req.user!.userId, req.user!.role, paramId(req, 'tabId'));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const closedTabs = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.listClosedTabs(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const tabGroups = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sessionId = String(req.query.sessionId ?? '');
  try {
    const data = await browserService.listTabGroups(req.user!.userId, sessionId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createTabGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    sessionId: z.string().min(1),
    name: z.string().min(1),
    color: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await browserService.createTabGroup(req.user!.userId, req.user!.role, body.sessionId, body.name, body.color);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const bookmarks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const folder = req.query.folder as string | undefined;
  try {
    const data = await browserService.listBookmarks(req.user!.userId, req.user!.role, folder);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const addBookmark = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    url: z.string().url(),
    title: z.string().min(1),
    folder: z.string().optional(),
    favorite: z.boolean().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await browserService.addBookmark(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const removeBookmark = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.removeBookmark(req.user!.userId, req.user!.role, paramId(req, 'bookmarkId'));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const history = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.listHistory(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const clearHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.clearHistory(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const downloads = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.listDownloads(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const startDownload = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    url: z.string().url(),
    filename: z.string().min(1),
    mimeType: z.string().optional(),
    size: z.number().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await browserService.startDownload(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const controlDownload = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    action: z.enum(['pause', 'resume', 'cancel']),
  }).parse(req.body ?? {});
  try {
    const data = await browserService.controlDownload(req.user!.userId, req.user!.role, paramId(req, 'downloadId'), body.action);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const readingList = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.listReadingList(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const addReadingList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    url: z.string().url(),
    title: z.string().min(1),
    excerpt: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await browserService.addReadingListItem(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const offlinePages = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.listOfflinePages(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const saveOfflinePage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    url: z.string().url(),
    title: z.string().min(1),
    content: z.string().min(1),
  }).parse(req.body ?? {});
  try {
    const data = await browserService.saveOfflinePage(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const getOfflinePage = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.getOfflinePage(req.user!.userId, req.user!.role, paramId(req, 'pageId'));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const passwords = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.listPasswords(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const savePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    origin: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(1),
    label: z.string().optional(),
    biometricProtected: z.boolean().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await browserService.savePassword(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const getPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const biometricVerified = req.query.biometricVerified === 'true';
  try {
    const data = await browserService.getPassword(req.user!.userId, req.user!.role, paramId(req, 'passwordId'), biometricVerified);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const savedForms = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.listSavedForms(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const saveForm = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    origin: z.string().min(1),
    fieldName: z.string().min(1),
    fieldValue: z.string().min(1),
  }).parse(req.body ?? {});
  try {
    const data = await browserService.saveFormField(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const savedCards = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.listSavedCards(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const saveCard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    label: z.string().min(1),
    cardNumber: z.string().min(13).max(19),
    expiryMonth: z.number().min(1).max(12),
    expiryYear: z.number().min(2024),
    cvv: z.string().min(3).max(4),
  }).parse(req.body ?? {});
  try {
    const data = await browserService.saveCard(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const sitePermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const origin = req.query.origin as string | undefined;
  try {
    const data = await browserService.listSitePermissions(req.user!.userId, origin, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const setSitePermission = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    origin: z.string().min(1),
    permission: z.enum(SITE_PERMISSION_TYPES as unknown as [string, ...string[]]),
    granted: z.boolean(),
  }).parse(req.body ?? {});
  try {
    const data = await browserService.setSitePermission(req.user!.userId, req.user!.role, body as never);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const translate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ content: z.string().min(1), targetLang: z.string().min(2) }).parse(req.body ?? {});
  try {
    const data = await browserService.translatePage(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const findInPage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ content: z.string().min(1), query: z.string().min(1) }).parse(req.body ?? {});
  try {
    const data = await browserService.findInPage(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const generateQr = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ url: z.string().url() }).parse(req.body ?? {});
  try {
    const data = await browserService.generateQr(req.user!.userId, req.user!.role, body.url);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const scanQr = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ raw: z.string().min(1) }).parse(req.body ?? {});
  try {
    const data = await browserService.scanQr(req.user!.userId, req.user!.role, body.raw);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const share = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ url: z.string().url(), title: z.string().min(1) }).parse(req.body ?? {});
  try {
    const data = await browserService.sharePage(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const profile = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.updateProfile(req.user!.userId, req.user!.role, req.body ?? {});
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    defaultSearchEngine: z.enum(SEARCH_ENGINES as unknown as [string, ...string[]]).optional(),
    desktopModeDefault: z.boolean().optional(),
    blockPopups: z.boolean().optional(),
    doNotTrack: z.boolean().optional(),
    saveHistory: z.boolean().optional(),
    syncTabs: z.boolean().optional(),
    syncBookmarks: z.boolean().optional(),
    readerModeDefault: z.boolean().optional(),
    homePageUrl: z.string().url().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await browserService.updateProfile(req.user!.userId, req.user!.role, body);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const rbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await browserService.getRbac(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateRbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    role: z.enum(BROWSER_ROLES as unknown as [string, ...string[]]),
    permissions: z.array(z.string()),
  }).parse(req.body ?? {});
  try {
    const data = await browserService.patchRbac(req.user!.userId, req.user!.role, body.role, body.permissions);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});
