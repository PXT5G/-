/** GULF Browser — com.gulfos.browser constants */

export const BROWSER_APP_BUNDLE = 'com.gulfos.browser' as const;

export const SEARCH_ENGINES = ['gulf', 'gulf_news', 'gulf_images'] as const;
export type SearchEngine = (typeof SEARCH_ENGINES)[number];

export const DEFAULT_SEARCH_ENGINE: SearchEngine = 'gulf';

export const DOWNLOAD_TYPES = [
  'image', 'video', 'audio', 'pdf', 'zip', 'document', 'application', 'other',
] as const;
export type DownloadType = (typeof DOWNLOAD_TYPES)[number];

export const DOWNLOAD_STATUSES = [
  'queued', 'downloading', 'paused', 'completed', 'failed', 'cancelled', 'scanning',
] as const;
export type DownloadStatus = (typeof DOWNLOAD_STATUSES)[number];

export const SITE_PERMISSION_TYPES = [
  'location', 'camera', 'microphone', 'notifications', 'storage', 'clipboard',
  'popups', 'background_sync',
] as const;
export type SitePermissionType = (typeof SITE_PERMISSION_TYPES)[number];

export const PORTAL_TYPES = [
  'public', 'government', 'banking', 'police', 'justice', 'business', 'media',
  'education', 'dark_web_ready', 'internal',
] as const;
export type PortalType = (typeof PORTAL_TYPES)[number];

export const BROWSER_PERMISSIONS = [
  'browser.access',
  'tabs.manage',
  'tabs.incognito',
  'bookmarks.manage',
  'history.view',
  'history.clear',
  'downloads.manage',
  'downloads.background',
  'reading_list.manage',
  'offline.manage',
  'passwords.manage',
  'passwords.biometric',
  'forms.autofill',
  'cards.saved',
  'search.use',
  'translate.use',
  'qr.scan',
  'qr.generate',
  'pdf.view',
  'print.use',
  'reader.mode',
  'share.page',
  'desktop.mode',
  'find.in.page',
  'portal.government',
  'portal.banking',
  'portal.police',
  'portal.justice',
  'portal.dark_web',
  'extensions.manage',
  'developer.tools',
  'sync.tabs',
  'sync.bookmarks',
  'sync.history',
  'site.permissions.manage',
  'audit.view',
] as const;

export type BrowserPermission = (typeof BROWSER_PERMISSIONS)[number];

export const BROWSER_ROLES = ['user', 'power_user', 'developer', 'admin'] as const;
export type BrowserRole = (typeof BROWSER_ROLES)[number];

export const DEFAULT_BROWSER_ROLE_PERMISSIONS: Record<BrowserRole, BrowserPermission[]> = {
  user: BROWSER_PERMISSIONS.filter((p) =>
    !['portal.police', 'portal.justice', 'portal.dark_web', 'cards.saved',
      'passwords.biometric', 'developer.tools', 'extensions.manage', 'audit.view'].includes(p)
  ),
  power_user: BROWSER_PERMISSIONS.filter((p) =>
    !['portal.dark_web', 'developer.tools', 'audit.view'].includes(p)
  ),
  developer: BROWSER_PERMISSIONS.filter((p) => p !== 'portal.dark_web'),
  admin: [...BROWSER_PERMISSIONS],
};

export const PORTAL_PERMISSION_MAP: Record<string, BrowserPermission> = {
  government: 'portal.government',
  banking: 'portal.banking',
  police: 'portal.police',
  justice: 'portal.justice',
  dark_web_ready: 'portal.dark_web',
};

export const BROWSER_SOCKET_EVENTS = [
  'browser:initialized',
  'browser:tab:update',
  'browser:tab:sync',
  'browser:download:progress',
  'browser:download:complete',
  'browser:history:update',
  'browser:bookmark:update',
  'browser:notification',
  'browser:session:sync',
] as const;

export const GULF_SEARCH_BASE = 'https://search.gulfos';

export const SEED_SITES = [
  {
    siteId: 'gulf-home',
    url: 'https://www.gulfos.com',
    title: 'GULFOS — Home',
    portalType: 'public' as PortalType,
    description: 'Official GULFOS operating system homepage',
    content: '# Welcome to GULFOS\n\nThe premium mobile web operating system by Gulf Technologies.\n\nExplore apps, settings, and services from your Gulf Phone V1.',
  },
  {
    siteId: 'gulf-search',
    url: 'https://search.gulfos',
    title: 'GULF Search',
    portalType: 'public' as PortalType,
    description: 'Default GULF Search engine',
    content: '# GULF Search\n\nSearch the GULFOS ecosystem and public server websites.',
  },
  {
    siteId: 'gov-portal',
    url: 'https://portal.gulfos.gov',
    title: 'Gulf Government Portal',
    portalType: 'government' as PortalType,
    description: 'Official government services',
    content: '# Gulf Government Portal\n\nAccess identity verification, permits, and public records.\n\nSign in with GULF Identity for full access.',
    requiresIdentity: true,
  },
  {
    siteId: 'bank-portal',
    url: 'https://bank.gulfos.finance',
    title: 'GULF Bank Online',
    portalType: 'banking' as PortalType,
    description: 'Secure banking portal',
    content: '# GULF Bank Online\n\nSecure banking with transfers, statements, and payment confirmation.\n\nOpen GULF Bank app for full features.',
    deepLink: 'gulfos://bank',
  },
  {
    siteId: 'police-portal',
    url: 'https://police.gulfos.gov',
    title: 'GULF Police Systems',
    portalType: 'police' as PortalType,
    description: 'Law enforcement portal (restricted)',
    content: '# GULF Police Systems\n\nAuthorized personnel only. MDT and dispatch systems.\n\nRequires GULF Police app and location permission.',
    deepLink: 'gulfos://police',
  },
  {
    siteId: 'justice-portal',
    url: 'https://justice.gulfos.gov',
    title: 'Gulf Justice Services',
    portalType: 'justice' as PortalType,
    description: 'Court and legal services',
    content: '# Gulf Justice Services\n\nCourt schedules, case lookup, and legal filings.\n\nRestricted access for authorized users.',
    deepLink: 'gulfos://justice',
  },
  {
    siteId: 'news-gulf',
    url: 'https://news.gulfos.media',
    title: 'GULF News',
    portalType: 'media' as PortalType,
    description: 'Server news and announcements',
    content: '# GULF News\n\nLatest headlines from the Gulf server community.\n\n• GULF Poetry platform launches\n• GULF Police MDT now live\n• Gulf Phone V1 updates available',
  },
  {
    siteId: 'business-hub',
    url: 'https://business.gulfos.com',
    title: 'Gulf Business Hub',
    portalType: 'business' as PortalType,
    description: 'Business directory and services',
    content: '# Gulf Business Hub\n\nDiscover businesses, services, and opportunities across the server.',
  },
] as const;
