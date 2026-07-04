import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { User } from '../database/models/User';
import { BrowserProfile } from '../database/models/BrowserProfile';
import { BrowserSession } from '../database/models/BrowserSession';
import { BrowserTab } from '../database/models/BrowserTab';
import { BrowserTabGroup } from '../database/models/BrowserTabGroup';
import { BrowserBookmark } from '../database/models/BrowserBookmark';
import { BrowserHistoryEntry } from '../database/models/BrowserHistoryEntry';
import { BrowserDownload } from '../database/models/BrowserDownload';
import { BrowserReadingListItem } from '../database/models/BrowserReadingListItem';
import { BrowserOfflinePage } from '../database/models/BrowserOfflinePage';
import { BrowserPassword } from '../database/models/BrowserPassword';
import { BrowserSavedForm } from '../database/models/BrowserSavedForm';
import { BrowserSavedCard } from '../database/models/BrowserSavedCard';
import { BrowserSearchHistory } from '../database/models/BrowserSearchHistory';
import { BrowserClosedTab } from '../database/models/BrowserClosedTab';
import { BrowserSitePermission } from '../database/models/BrowserSitePermission';
import { BrowserSite } from '../database/models/BrowserSite';
import {
  BROWSER_APP_BUNDLE,
  BROWSER_SOCKET_EVENTS,
  DEFAULT_SEARCH_ENGINE,
  GULF_SEARCH_BASE,
  PORTAL_PERMISSION_MAP,
  SEARCH_ENGINES,
  SEED_SITES,
  SITE_PERMISSION_TYPES,
  type DownloadType,
  type SitePermissionType,
} from '../constants/browser';
import {
  seedBrowserRoleConfigs,
  getRolePermissions,
  assertBrowserPermission,
  checkBrowserPermission,
  formatBrowserProfile,
  getBrowserProfile,
  updateRolePermissions,
} from './browserRBACService';
import {
  buildReaderModeContent,
  buildSharePayload,
  decryptBrowserSecret,
  encryptBrowserSecret,
  findInPageContent,
  generateQrPayload,
  getIntegrationStatus,
  inferDownloadType,
  logBrowserAction,
  normalizeOrigin,
  parseQrScanResult,
  resolveDeepLink,
  sendBrowserNotification,
  translatePageContent,
  validateHttps,
} from './browserIntegrationService';
import { checkPermission } from './permissionBrokerService';
import { emitToUser } from './socketService';
import { checkAvailableStorage, reserveStorage } from './deviceStorageService';

function id(prefix: string) {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

const activeDownloadJobs = new Map<string, ReturnType<typeof setInterval>>();

function formatTab(tab: InstanceType<typeof BrowserTab>) {
  return {
    tabId: tab.tabId,
    sessionId: tab.sessionId,
    url: tab.url,
    title: tab.title,
    favicon: tab.favicon,
    pinned: tab.pinned,
    groupId: tab.groupId,
    orderIndex: tab.orderIndex,
    desktopMode: tab.desktopMode,
    readerMode: tab.readerMode,
    loading: tab.loading,
    canGoBack: tab.canGoBack,
    canGoForward: tab.canGoForward,
    scrollPosition: tab.scrollPosition,
  };
}

function formatSite(site: InstanceType<typeof BrowserSite>) {
  return {
    siteId: site.siteId,
    url: site.url,
    title: site.title,
    description: site.description,
    portalType: site.portalType,
    content: site.content,
    deepLink: site.deepLink,
    requiresIdentity: site.requiresIdentity,
    favicon: site.favicon,
  };
}

async function emitBrowser(userId: string, event: string, data: unknown) {
  emitToUser(userId, event as never, { ...data as object, timestamp: new Date().toISOString() });
}

export async function seedBrowserSites(): Promise<void> {
  for (const site of SEED_SITES) {
    await BrowserSite.findOneAndUpdate(
      { siteId: site.siteId },
      {
        siteId: site.siteId,
        url: site.url,
        title: site.title,
        description: site.description,
        portalType: site.portalType,
        content: site.content,
        deepLink: 'deepLink' in site ? site.deepLink : undefined,
        requiresIdentity: 'requiresIdentity' in site ? site.requiresIdentity : false,
        httpsOnly: true,
        enabled: true,
      },
      { upsert: true }
    );
  }
}

export async function initializeBrowser(userId: string, userRole?: string, deviceUuid?: string) {
  await seedBrowserRoleConfigs();
  await seedBrowserSites();

  const hasApp = await checkPermission(userId, BROWSER_APP_BUNDLE, 'network');
  if (!hasApp && userRole !== 'admin') throw new Error('APP_NOT_INSTALLED');

  let profile = await BrowserProfile.findOne({ userId, deletedAt: null });
  if (!profile) {
    const user = await User.findById(userId);
    if (!user) throw new Error('USER_NOT_FOUND');
    profile = await BrowserProfile.create({
      userId: new Types.ObjectId(userId),
      role: 'user',
      homePageUrl: 'https://www.gulfos.com',
      createdBy: new Types.ObjectId(userId),
    });
  }

  let session = await BrowserSession.findOne({ userId, incognito: false }).sort({ lastActiveAt: -1 });
  if (!session) {
    session = await BrowserSession.create({
      sessionId: id('SESS'),
      userId: new Types.ObjectId(userId),
      incognito: false,
      deviceUuid,
      lastActiveAt: new Date(),
    });
    const tab = await BrowserTab.create({
      tabId: id('TAB'),
      sessionId: session.sessionId,
      userId: new Types.ObjectId(userId),
      url: profile.homePageUrl,
      title: 'New Tab',
      orderIndex: 0,
    });
    session.activeTabId = tab.tabId;
    await session.save();
  }

  const permissions = await getRolePermissions(profile.role);
  const integrations = await getIntegrationStatus(userId);
  const sites = await BrowserSite.find({ enabled: true }).lean();
  const tabs = await BrowserTab.find({ sessionId: session.sessionId }).sort({ orderIndex: 1 });

  const payload = {
    profile: formatBrowserProfile(profile),
    permissions,
    integrations,
    searchEngines: SEARCH_ENGINES,
    defaultSearchEngine: profile.defaultSearchEngine ?? DEFAULT_SEARCH_ENGINE,
    session: {
      sessionId: session.sessionId,
      incognito: session.incognito,
      activeTabId: session.activeTabId,
    },
    tabs: tabs.map(formatTab),
    quickLinks: sites.map((s) => ({ url: s.url, title: s.title, portalType: s.portalType })),
    socketEvents: BROWSER_SOCKET_EVENTS,
  };

  emitBrowser(userId, 'browser:initialized', payload);
  return payload;
}

export async function getBrowserHome(userId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'browser.access', userRole);
  const profile = await getBrowserProfile(userId);
  const sites = await BrowserSite.find({ enabled: true }).lean();
  const bookmarks = await BrowserBookmark.find({ userId, deletedAt: null, favorite: true })
    .sort({ updatedAt: -1 }).limit(8);
  const recent = await BrowserHistoryEntry.find({ userId, incognito: false })
    .sort({ lastVisitedAt: -1 }).limit(8);

  return {
    homePageUrl: profile?.homePageUrl ?? 'https://www.gulfos.com',
    quickLinks: sites.map((s) => ({ url: s.url, title: s.title, portalType: s.portalType, description: s.description })),
    favorites: bookmarks.map((b) => ({ url: b.url, title: b.title })),
    recent: recent.map((h) => ({ url: h.url, title: h.title, lastVisitedAt: h.lastVisitedAt.toISOString() })),
  };
}

async function resolveSite(url: string) {
  const normalized = url.startsWith('http') ? url : `https://${url}`;
  let site = await BrowserSite.findOne({ url: normalized, enabled: true });
  if (!site) {
    const host = normalizeOrigin(normalized);
    site = await BrowserSite.findOne({ url: { $regex: host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }, enabled: true });
  }
  return site;
}

async function assertPortalAccess(userId: string, portalType: string, userRole?: string) {
  const perm = PORTAL_PERMISSION_MAP[portalType];
  if (perm) await assertBrowserPermission(userId, perm, userRole);
}

export async function navigate(
  userId: string,
  userRole: string | undefined,
  input: { tabId: string; url: string; incognito?: boolean }
) {
  await assertBrowserPermission(userId, 'browser.access', userRole);
  if (!validateHttps(input.url) && !input.url.startsWith('about:')) throw new Error('HTTPS_REQUIRED');

  const tab = await BrowserTab.findOne({ tabId: input.tabId, userId });
  if (!tab) throw new Error('TAB_NOT_FOUND');

  const session = await BrowserSession.findOne({ sessionId: tab.sessionId, userId });
  const incognito = session?.incognito ?? false;

  let url = input.url;
  if (url.startsWith('about:blank')) {
    tab.url = url;
    tab.title = 'New Tab';
    tab.loading = false;
    await tab.save();
    return { tab: formatTab(tab), page: null };
  }

  const site = await resolveSite(url);
  if (site) {
    await assertPortalAccess(userId, site.portalType, userRole);
    url = site.url;
    tab.url = url;
    tab.title = site.title;
    tab.favicon = site.favicon;
    tab.loading = false;
    tab.canGoBack = true;
    await tab.save();

    const profile = await getBrowserProfile(userId);
    if (profile?.saveHistory && !incognito) {
      await recordHistory(userId, url, site.title, false);
    }

    const deepLink = await resolveDeepLink(url);
    const page = {
      ...formatSite(site),
      readerContent: buildReaderModeContent(site.title, site.content),
      deepLink,
      httpsValid: validateHttps(url),
    };

    emitBrowser(userId, 'browser:tab:update', { tab: formatTab(tab), page });
    return { tab: formatTab(tab), page };
  }

  if (url.includes('search.gulfos') || url.startsWith(GULF_SEARCH_BASE)) {
    const q = new URL(url).searchParams.get('q') ?? '';
    const results = await searchSites(userId, userRole, q);
    tab.url = url;
    tab.title = q ? `GULF Search: ${q}` : 'GULF Search';
    tab.loading = false;
    await tab.save();
    return { tab: formatTab(tab), page: { type: 'search', query: q, results } };
  }

  throw new Error('SITE_NOT_FOUND');
}

async function recordHistory(userId: string, url: string, title: string, incognito: boolean) {
  const existing = await BrowserHistoryEntry.findOne({ userId, url, incognito });
  if (existing) {
    existing.visitCount += 1;
    existing.lastVisitedAt = new Date();
    existing.title = title;
    await existing.save();
  } else {
    await BrowserHistoryEntry.create({
      historyId: id('HIST'),
      userId: new Types.ObjectId(userId),
      url,
      title,
      incognito,
      lastVisitedAt: new Date(),
    });
  }
  emitBrowser(userId, 'browser:history:update', { url, title });
}

export async function searchSites(userId: string, userRole: string | undefined, query: string) {
  await assertBrowserPermission(userId, 'search.use', userRole);
  if (!query.trim()) return [];

  await BrowserSearchHistory.create({
    searchId: id('SRCH'),
    userId: new Types.ObjectId(userId),
    query: query.trim(),
    engine: DEFAULT_SEARCH_ENGINE,
    searchedAt: new Date(),
  });

  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const sites = await BrowserSite.find({
    enabled: true,
    $or: [{ title: regex }, { description: regex }, { content: regex }, { url: regex }],
  }).limit(20);

  const accessible: ReturnType<typeof formatSite>[] = [];
  for (const site of sites) {
    try {
      await assertPortalAccess(userId, site.portalType, userRole);
      accessible.push(formatSite(site));
    } catch {
      // skip restricted portals
    }
  }
  return accessible;
}

export async function listSessions(userId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'tabs.manage', userRole);
  return BrowserSession.find({ userId }).sort({ lastActiveAt: -1 }).lean();
}

export async function createSession(userId: string, userRole: string | undefined, incognito: boolean, deviceUuid?: string) {
  if (incognito) await assertBrowserPermission(userId, 'tabs.incognito', userRole);
  else await assertBrowserPermission(userId, 'tabs.manage', userRole);

  const profile = await getBrowserProfile(userId);
  const session = await BrowserSession.create({
    sessionId: id('SESS'),
    userId: new Types.ObjectId(userId),
    incognito,
    deviceUuid,
    lastActiveAt: new Date(),
  });

  const tab = await BrowserTab.create({
    tabId: id('TAB'),
    sessionId: session.sessionId,
    userId: new Types.ObjectId(userId),
    url: incognito ? 'about:blank' : (profile?.homePageUrl ?? 'https://www.gulfos.com'),
    title: incognito ? 'Private Tab' : 'New Tab',
    orderIndex: 0,
  });
  session.activeTabId = tab.tabId;
  await session.save();

  emitBrowser(userId, 'browser:session:sync', { sessionId: session.sessionId, incognito });
  return { sessionId: session.sessionId, incognito, activeTabId: tab.tabId, tabs: [formatTab(tab)] };
}

export async function listTabs(userId: string, sessionId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'tabs.manage', userRole);
  const tabs = await BrowserTab.find({ userId, sessionId }).sort({ orderIndex: 1 });
  return tabs.map(formatTab);
}

export async function createTab(userId: string, userRole: string | undefined, sessionId: string, url?: string) {
  await assertBrowserPermission(userId, 'tabs.manage', userRole);
  const count = await BrowserTab.countDocuments({ sessionId, userId });
  const profile = await getBrowserProfile(userId);
  const tab = await BrowserTab.create({
    tabId: id('TAB'),
    sessionId,
    userId: new Types.ObjectId(userId),
    url: url ?? profile?.homePageUrl ?? 'https://www.gulfos.com',
    title: 'New Tab',
    orderIndex: count,
  });

  await BrowserSession.findOneAndUpdate({ sessionId, userId }, { activeTabId: tab.tabId, lastActiveAt: new Date() });
  emitBrowser(userId, 'browser:tab:sync', { tabs: [formatTab(tab)] });
  return formatTab(tab);
}

export async function updateTab(
  userId: string,
  userRole: string | undefined,
  tabId: string,
  updates: Partial<{ pinned: boolean; groupId: string | null; desktopMode: boolean; readerMode: boolean; orderIndex: number }>
) {
  await assertBrowserPermission(userId, 'tabs.manage', userRole);
  const tab = await BrowserTab.findOne({ tabId, userId });
  if (!tab) throw new Error('TAB_NOT_FOUND');

  if (updates.pinned !== undefined) tab.pinned = updates.pinned;
  if (updates.groupId !== undefined) tab.groupId = updates.groupId ?? undefined;
  if (updates.desktopMode !== undefined) {
    await assertBrowserPermission(userId, 'desktop.mode', userRole);
    tab.desktopMode = updates.desktopMode;
  }
  if (updates.readerMode !== undefined) {
    await assertBrowserPermission(userId, 'reader.mode', userRole);
    tab.readerMode = updates.readerMode;
  }
  if (updates.orderIndex !== undefined) tab.orderIndex = updates.orderIndex;
  await tab.save();

  emitBrowser(userId, 'browser:tab:update', { tab: formatTab(tab) });
  return formatTab(tab);
}

export async function closeTab(userId: string, userRole: string | undefined, tabId: string) {
  await assertBrowserPermission(userId, 'tabs.manage', userRole);
  const tab = await BrowserTab.findOne({ tabId, userId });
  if (!tab) throw new Error('TAB_NOT_FOUND');

  await BrowserClosedTab.create({
    closedId: id('CLSD'),
    userId: new Types.ObjectId(userId),
    url: tab.url,
    title: tab.title,
  });

  const sessionId = tab.sessionId;
  await tab.deleteOne();

  const remaining = await BrowserTab.find({ sessionId, userId }).sort({ orderIndex: 1 });
  if (remaining.length === 0) {
    const newTab = await createTab(userId, userRole, sessionId);
    return { closed: tabId, tabs: [newTab] };
  }

  await BrowserSession.findOneAndUpdate({ sessionId, userId }, { activeTabId: remaining[0].tabId });
  emitBrowser(userId, 'browser:tab:sync', { tabs: remaining.map(formatTab) });
  return { closed: tabId, tabs: remaining.map(formatTab) };
}

export async function listClosedTabs(userId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'tabs.manage', userRole);
  const tabs = await BrowserClosedTab.find({ userId }).sort({ closedAt: -1 }).limit(25);
  return tabs.map((t) => ({ closedId: t.closedId, url: t.url, title: t.title, closedAt: t.closedAt.toISOString() }));
}

export async function listTabGroups(userId: string, sessionId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'tabs.manage', userRole);
  return BrowserTabGroup.find({ userId, sessionId }).lean();
}

export async function createTabGroup(userId: string, userRole: string | undefined, sessionId: string, name: string, color?: string) {
  await assertBrowserPermission(userId, 'tabs.manage', userRole);
  const group = await BrowserTabGroup.create({
    groupId: id('GRP'),
    userId: new Types.ObjectId(userId),
    sessionId,
    name,
    color: color ?? '#DC2626',
  });
  return group.toObject();
}

export async function listBookmarks(userId: string, userRole?: string, folder?: string) {
  await assertBrowserPermission(userId, 'bookmarks.manage', userRole);
  const filter: Record<string, unknown> = { userId, deletedAt: null };
  if (folder) filter.folder = folder;
  const items = await BrowserBookmark.find(filter).sort({ title: 1 });
  return items.map((b) => ({
    bookmarkId: b.bookmarkId, url: b.url, title: b.title, folder: b.folder, favorite: b.favorite,
  }));
}

export async function addBookmark(userId: string, userRole: string | undefined, input: { url: string; title: string; folder?: string; favorite?: boolean }) {
  await assertBrowserPermission(userId, 'bookmarks.manage', userRole);
  const bookmark = await BrowserBookmark.create({
    bookmarkId: id('BMK'),
    userId: new Types.ObjectId(userId),
    url: input.url,
    title: input.title,
    folder: input.folder ?? 'Bookmarks',
    favorite: input.favorite ?? false,
    createdBy: new Types.ObjectId(userId),
  });
  emitBrowser(userId, 'browser:bookmark:update', { action: 'add', bookmarkId: bookmark.bookmarkId });
  return { bookmarkId: bookmark.bookmarkId, url: bookmark.url, title: bookmark.title, folder: bookmark.folder, favorite: bookmark.favorite };
}

export async function removeBookmark(userId: string, userRole: string | undefined, bookmarkId: string) {
  await assertBrowserPermission(userId, 'bookmarks.manage', userRole);
  await BrowserBookmark.findOneAndUpdate({ bookmarkId, userId }, { deletedAt: new Date() });
  emitBrowser(userId, 'browser:bookmark:update', { action: 'remove', bookmarkId });
  return { deleted: true };
}

export async function listHistory(userId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'history.view', userRole);
  const entries = await BrowserHistoryEntry.find({ userId, incognito: false }).sort({ lastVisitedAt: -1 }).limit(100);
  return entries.map((e) => ({
    historyId: e.historyId, url: e.url, title: e.title, visitCount: e.visitCount,
    lastVisitedAt: e.lastVisitedAt.toISOString(),
  }));
}

export async function clearHistory(userId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'history.clear', userRole);
  await BrowserHistoryEntry.deleteMany({ userId });
  await logBrowserAction(userId, 'browser_history_clear', 'browser_history');
  return { cleared: true };
}

export async function listDownloads(userId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'downloads.manage', userRole);
  const items = await BrowserDownload.find({ userId }).sort({ createdAt: -1 }).limit(50);
  return items.map((d) => ({
    downloadId: d.downloadId, url: d.url, filename: d.filename, mimeType: d.mimeType,
    downloadType: d.downloadType, status: d.status, size: d.size, downloadedBytes: d.downloadedBytes,
    progress: d.progress, scanStatus: d.scanStatus, completedAt: d.completedAt?.toISOString(),
  }));
}

async function runDownloadJob(downloadId: string, userId: string) {
  const download = await BrowserDownload.findOne({ downloadId, userId });
  if (!download || download.status === 'cancelled') return;

  download.status = 'downloading';
  await download.save();

  const tickMs = 200;
  const total = download.size || 1_048_576;
  let bytes = download.downloadedBytes;

  const interval = setInterval(async () => {
    const current = await BrowserDownload.findOne({ downloadId, userId });
    if (!current || current.status === 'paused' || current.status === 'cancelled') {
      clearInterval(interval);
      activeDownloadJobs.delete(downloadId);
      return;
    }

    bytes = Math.min(total, bytes + Math.floor(total * 0.08));
    const progress = Math.round((bytes / total) * 100);
    current.downloadedBytes = bytes;
    current.progress = progress;
    await current.save();

    emitBrowser(userId, 'browser:download:progress', {
      downloadId, progress, downloadedBytes: bytes, totalBytes: total, status: current.status,
    });

    if (bytes >= total) {
      clearInterval(interval);
      activeDownloadJobs.delete(downloadId);
      current.status = 'scanning';
      await current.save();
      setTimeout(async () => {
        const fin = await BrowserDownload.findOne({ downloadId, userId });
        if (!fin) return;
        fin.status = 'completed';
        fin.scanStatus = 'clean';
        fin.progress = 100;
        fin.completedAt = new Date();
        fin.storagePath = `/downloads/${userId}/${fin.filename}`;
        await fin.save();
        emitBrowser(userId, 'browser:download:complete', { downloadId, filename: fin.filename });
        sendBrowserNotification(userId, 'Download complete', fin.filename);
      }, 500);
    }
  }, tickMs);

  activeDownloadJobs.set(downloadId, interval);
}

export async function startDownload(
  userId: string,
  userRole: string | undefined,
  input: { url: string; filename: string; mimeType?: string; size?: number }
) {
  await assertBrowserPermission(userId, 'downloads.manage', userRole);
  const size = input.size ?? 1_048_576;
  const storage = await checkAvailableStorage(userId, size);
  if (!storage.available) throw new Error('INSUFFICIENT_STORAGE');

  const downloadType = inferDownloadType(input.mimeType ?? 'application/octet-stream', input.filename) as DownloadType;
  const download = await BrowserDownload.create({
    downloadId: id('DL'),
    userId: new Types.ObjectId(userId),
    url: input.url,
    filename: input.filename,
    mimeType: input.mimeType ?? 'application/octet-stream',
    downloadType,
    status: 'queued',
    size,
    downloadedBytes: 0,
    progress: 0,
  });

  await reserveStorage(userId, BROWSER_APP_BUNDLE, size, download.downloadId);
  await runDownloadJob(download.downloadId, userId);
  return { downloadId: download.downloadId, status: download.status };
}

export async function controlDownload(
  userId: string,
  userRole: string | undefined,
  downloadId: string,
  action: 'pause' | 'resume' | 'cancel'
) {
  await assertBrowserPermission(userId, 'downloads.manage', userRole);
  const download = await BrowserDownload.findOne({ downloadId, userId });
  if (!download) throw new Error('DOWNLOAD_NOT_FOUND');

  if (action === 'pause') download.status = 'paused';
  else if (action === 'resume') {
    download.status = 'downloading';
    if (!activeDownloadJobs.has(downloadId)) await runDownloadJob(downloadId, userId);
  } else if (action === 'cancel') {
    download.status = 'cancelled';
    const job = activeDownloadJobs.get(downloadId);
    if (job) { clearInterval(job); activeDownloadJobs.delete(downloadId); }
  }
  await download.save();
  return { downloadId, status: download.status };
}

export async function listReadingList(userId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'reading_list.manage', userRole);
  const items = await BrowserReadingListItem.find({ userId }).sort({ addedAt: -1 });
  return items.map((i) => ({
    itemId: i.itemId, url: i.url, title: i.title, excerpt: i.excerpt, read: i.read,
    addedAt: i.addedAt.toISOString(),
  }));
}

export async function addReadingListItem(userId: string, userRole: string | undefined, input: { url: string; title: string; excerpt?: string }) {
  await assertBrowserPermission(userId, 'reading_list.manage', userRole);
  const item = await BrowserReadingListItem.create({
    itemId: id('READ'),
    userId: new Types.ObjectId(userId),
    url: input.url,
    title: input.title,
    excerpt: input.excerpt ?? '',
    read: false,
    addedAt: new Date(),
  });
  return { itemId: item.itemId, url: item.url, title: item.title };
}

export async function listOfflinePages(userId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'offline.manage', userRole);
  const pages = await BrowserOfflinePage.find({ userId }).sort({ cachedAt: -1 });
  return pages.map((p) => ({
    pageId: p.pageId, url: p.url, title: p.title, sizeBytes: p.sizeBytes, cachedAt: p.cachedAt.toISOString(),
  }));
}

export async function saveOfflinePage(userId: string, userRole: string | undefined, input: { url: string; title: string; content: string }) {
  await assertBrowserPermission(userId, 'offline.manage', userRole);
  const sizeBytes = Buffer.byteLength(input.content, 'utf8');
  const page = await BrowserOfflinePage.create({
    pageId: id('OFF'),
    userId: new Types.ObjectId(userId),
    url: input.url,
    title: input.title,
    content: input.content,
    sizeBytes,
    cachedAt: new Date(),
  });
  return { pageId: page.pageId, url: page.url, title: page.title, sizeBytes };
}

export async function getOfflinePage(userId: string, userRole: string | undefined, pageId: string) {
  await assertBrowserPermission(userId, 'offline.manage', userRole);
  const page = await BrowserOfflinePage.findOne({ pageId, userId });
  if (!page) throw new Error('PAGE_NOT_FOUND');
  return { pageId: page.pageId, url: page.url, title: page.title, content: page.content };
}

export async function listPasswords(userId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'passwords.manage', userRole);
  const items = await BrowserPassword.find({ userId, deletedAt: null });
  return items.map((p) => ({
    passwordId: p.passwordId, origin: p.origin, username: p.username, label: p.label,
    biometricProtected: p.biometricProtected, lastUsedAt: p.lastUsedAt?.toISOString(),
  }));
}

export async function savePassword(
  userId: string,
  userRole: string | undefined,
  input: { origin: string; username: string; password: string; label?: string; biometricProtected?: boolean }
) {
  await assertBrowserPermission(userId, 'passwords.manage', userRole);
  if (input.biometricProtected) await assertBrowserPermission(userId, 'passwords.biometric', userRole);

  const encryptedPassword = encryptBrowserSecret(userId, input.password);
  const existing = await BrowserPassword.findOne({ userId, origin: input.origin, username: input.username, deletedAt: null });
  if (existing) {
    existing.encryptedPassword = encryptedPassword;
    existing.label = input.label;
    existing.biometricProtected = input.biometricProtected ?? false;
    await existing.save();
    return { passwordId: existing.passwordId, origin: existing.origin, username: existing.username };
  }

  const record = await BrowserPassword.create({
    passwordId: id('PWD'),
    userId: new Types.ObjectId(userId),
    origin: input.origin,
    username: input.username,
    encryptedPassword,
    label: input.label,
    biometricProtected: input.biometricProtected ?? false,
    createdBy: new Types.ObjectId(userId),
  });
  return { passwordId: record.passwordId, origin: record.origin, username: record.username };
}

export async function getPassword(userId: string, userRole: string | undefined, passwordId: string, biometricVerified?: boolean) {
  await assertBrowserPermission(userId, 'passwords.manage', userRole);
  const record = await BrowserPassword.findOne({ passwordId, userId, deletedAt: null });
  if (!record) throw new Error('PASSWORD_NOT_FOUND');
  if (record.biometricProtected && !biometricVerified) throw new Error('BIOMETRIC_REQUIRED');

  record.lastUsedAt = new Date();
  await record.save();
  return {
    passwordId: record.passwordId,
    origin: record.origin,
    username: record.username,
    password: decryptBrowserSecret(userId, record.encryptedPassword),
  };
}

export async function listSavedForms(userId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'forms.autofill', userRole);
  const forms = await BrowserSavedForm.find({ userId });
  return forms.map((f) => ({
    formId: f.formId, origin: f.origin, fieldName: f.fieldName, fieldValue: f.fieldValue,
  }));
}

export async function saveFormField(userId: string, userRole: string | undefined, input: { origin: string; fieldName: string; fieldValue: string }) {
  await assertBrowserPermission(userId, 'forms.autofill', userRole);
  const form = await BrowserSavedForm.create({
    formId: id('FORM'),
    userId: new Types.ObjectId(userId),
    origin: input.origin,
    fieldName: input.fieldName,
    fieldValue: input.fieldValue,
    createdBy: new Types.ObjectId(userId),
  });
  return { formId: form.formId, origin: form.origin, fieldName: form.fieldName };
}

export async function listSavedCards(userId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'cards.saved', userRole);
  const cards = await BrowserSavedCard.find({ userId, deletedAt: null });
  return cards.map((c) => ({
    cardId: c.cardId, label: c.label, lastFour: c.lastFour, expiryMonth: c.expiryMonth, expiryYear: c.expiryYear,
  }));
}

export async function saveCard(
  userId: string,
  userRole: string | undefined,
  input: { label: string; cardNumber: string; expiryMonth: number; expiryYear: number; cvv: string }
) {
  await assertBrowserPermission(userId, 'cards.saved', userRole);
  const lastFour = input.cardNumber.slice(-4);
  const encryptedPayload = encryptBrowserSecret(userId, JSON.stringify({
    cardNumber: input.cardNumber, cvv: input.cvv,
  }));
  const card = await BrowserSavedCard.create({
    cardId: id('CARD'),
    userId: new Types.ObjectId(userId),
    label: input.label,
    lastFour,
    expiryMonth: input.expiryMonth,
    expiryYear: input.expiryYear,
    encryptedPayload,
    createdBy: new Types.ObjectId(userId),
  });
  return { cardId: card.cardId, label: card.label, lastFour: card.lastFour };
}

export async function listSitePermissions(userId: string, origin?: string, userRole?: string) {
  await assertBrowserPermission(userId, 'site.permissions.manage', userRole);
  const filter: Record<string, unknown> = { userId };
  if (origin) filter.origin = normalizeOrigin(origin);
  return BrowserSitePermission.find(filter).lean();
}

export async function setSitePermission(
  userId: string,
  userRole: string | undefined,
  input: { origin: string; permission: SitePermissionType; granted: boolean }
) {
  await assertBrowserPermission(userId, 'site.permissions.manage', userRole);
  if (!SITE_PERMISSION_TYPES.includes(input.permission)) throw new Error('INVALID_PERMISSION');

  const origin = normalizeOrigin(input.origin);
  const record = await BrowserSitePermission.findOneAndUpdate(
    { userId, origin, permission: input.permission },
    {
      permissionId: id('PERM'),
      userId: new Types.ObjectId(userId),
      origin,
      permission: input.permission,
      granted: input.granted,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { origin: record.origin, permission: record.permission, granted: record.granted };
}

export async function getSearchHistory(userId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'search.use', userRole);
  const items = await BrowserSearchHistory.find({ userId }).sort({ searchedAt: -1 }).limit(30);
  return items.map((s) => ({ searchId: s.searchId, query: s.query, engine: s.engine, searchedAt: s.searchedAt.toISOString() }));
}

export async function getSearchSuggestions(userId: string, userRole: string | undefined, prefix: string) {
  await assertBrowserPermission(userId, 'search.use', userRole);
  const regex = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
  const history = await BrowserSearchHistory.find({ userId, query: regex }).sort({ searchedAt: -1 }).limit(5);
  const sites = await BrowserSite.find({ enabled: true, title: regex }).limit(5);
  return {
    history: history.map((h) => h.query),
    sites: sites.map((s) => ({ url: s.url, title: s.title })),
  };
}

export async function translatePage(userId: string, userRole: string | undefined, input: { content: string; targetLang: string }) {
  await assertBrowserPermission(userId, 'translate.use', userRole);
  return { translated: translatePageContent(input.content, input.targetLang) };
}

export async function findInPage(userId: string, userRole: string | undefined, input: { content: string; query: string }) {
  await assertBrowserPermission(userId, 'find.in.page', userRole);
  return findInPageContent(input.content, input.query);
}

export async function generateQr(userId: string, userRole: string | undefined, url: string) {
  await assertBrowserPermission(userId, 'qr.generate', userRole);
  return generateQrPayload(url);
}

export async function scanQr(userId: string, userRole: string | undefined, raw: string) {
  await assertBrowserPermission(userId, 'qr.scan', userRole);
  return parseQrScanResult(raw);
}

export async function sharePage(userId: string, userRole: string | undefined, input: { url: string; title: string }) {
  await assertBrowserPermission(userId, 'share.page', userRole);
  return buildSharePayload(input.url, input.title);
}

export async function updateProfile(userId: string, userRole: string | undefined, updates: Record<string, unknown>) {
  await assertBrowserPermission(userId, 'browser.access', userRole);
  const profile = await BrowserProfile.findOne({ userId, deletedAt: null });
  if (!profile) throw new Error('BROWSER_NOT_INITIALIZED');

  const allowed = ['defaultSearchEngine', 'desktopModeDefault', 'blockPopups', 'doNotTrack', 'saveHistory',
    'syncTabs', 'syncBookmarks', 'readerModeDefault', 'homePageUrl'] as const;
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      switch (key) {
        case 'defaultSearchEngine': profile.defaultSearchEngine = updates[key] as typeof profile.defaultSearchEngine; break;
        case 'desktopModeDefault': profile.desktopModeDefault = Boolean(updates[key]); break;
        case 'blockPopups': profile.blockPopups = Boolean(updates[key]); break;
        case 'doNotTrack': profile.doNotTrack = Boolean(updates[key]); break;
        case 'saveHistory': profile.saveHistory = Boolean(updates[key]); break;
        case 'syncTabs': profile.syncTabs = Boolean(updates[key]); break;
        case 'syncBookmarks': profile.syncBookmarks = Boolean(updates[key]); break;
        case 'readerModeDefault': profile.readerModeDefault = Boolean(updates[key]); break;
        case 'homePageUrl': profile.homePageUrl = String(updates[key]); break;
      }
    }
  }
  await profile.save();
  return formatBrowserProfile(profile);
}

export async function getRbac(userId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'audit.view', userRole);
  const profile = await getBrowserProfile(userId);
  const role = profile?.role ?? 'user';
  const permissions = await getRolePermissions(role);
  return { role, permissions };
}

export async function patchRbac(userId: string, userRole: string | undefined, role: string, permissions: string[]) {
  if (userRole !== 'admin') await assertBrowserPermission(userId, 'audit.view', userRole);
  return updateRolePermissions(role as never, permissions as never, userId);
}

export async function listSites(userId: string, userRole?: string) {
  await assertBrowserPermission(userId, 'browser.access', userRole);
  const sites = await BrowserSite.find({ enabled: true }).lean();
  const result = [];
  for (const site of sites) {
    try {
      await assertPortalAccess(userId, site.portalType, userRole);
      result.push(formatSite(site as never));
    } catch {
      // restricted
    }
  }
  return result;
}
