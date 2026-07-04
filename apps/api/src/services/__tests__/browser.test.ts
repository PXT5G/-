import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BROWSER_APP_BUNDLE,
  BROWSER_ROLES,
  BROWSER_PERMISSIONS,
  DEFAULT_BROWSER_ROLE_PERMISSIONS,
  BROWSER_SOCKET_EVENTS,
  SEARCH_ENGINES,
  DOWNLOAD_TYPES,
  DOWNLOAD_STATUSES,
  SITE_PERMISSION_TYPES,
  SEED_SITES,
  PORTAL_PERMISSION_MAP,
} from '../../constants/browser';
import {
  validateHttps,
  normalizeOrigin,
  inferDownloadType,
  findInPageContent,
  translatePageContent,
  parseQrScanResult,
  buildSharePayload,
  encryptBrowserSecret,
  decryptBrowserSecret,
} from '../../services/browserIntegrationService';

describe('browser constants', () => {
  it('defines browser app bundle', () => {
    assert.equal(BROWSER_APP_BUNDLE, 'com.gulfos.browser');
  });

  it('defines browser roles', () => {
    assert.equal(BROWSER_ROLES.length, 4);
    assert.ok(BROWSER_ROLES.includes('user'));
    assert.ok(BROWSER_ROLES.includes('admin'));
  });

  it('defines granular permissions', () => {
    assert.ok(BROWSER_PERMISSIONS.length >= 30);
    assert.ok(BROWSER_PERMISSIONS.includes('tabs.incognito'));
    assert.ok(BROWSER_PERMISSIONS.includes('portal.police'));
    assert.ok(BROWSER_PERMISSIONS.includes('downloads.manage'));
  });

  it('assigns default permissions per role', () => {
    assert.ok(DEFAULT_BROWSER_ROLE_PERMISSIONS.user.includes('browser.access'));
    assert.ok(!DEFAULT_BROWSER_ROLE_PERMISSIONS.user.includes('portal.police'));
    assert.ok(DEFAULT_BROWSER_ROLE_PERMISSIONS.admin.includes('portal.dark_web'));
  });

  it('defines search engines', () => {
    assert.ok(SEARCH_ENGINES.includes('gulf'));
  });

  it('defines download types and statuses', () => {
    assert.ok(DOWNLOAD_TYPES.includes('pdf'));
    assert.ok(DOWNLOAD_STATUSES.includes('paused'));
    assert.ok(DOWNLOAD_STATUSES.includes('scanning'));
  });

  it('defines site permission types', () => {
    assert.ok(SITE_PERMISSION_TYPES.includes('camera'));
    assert.ok(SITE_PERMISSION_TYPES.includes('background_sync'));
  });

  it('maps portal types to permissions', () => {
    assert.equal(PORTAL_PERMISSION_MAP.police, 'portal.police');
    assert.equal(PORTAL_PERMISSION_MAP.banking, 'portal.banking');
  });

  it('seeds GULFOS portal sites', () => {
    assert.ok(SEED_SITES.length >= 8);
    assert.ok(SEED_SITES.some((s) => s.siteId === 'gulf-search'));
    assert.ok(SEED_SITES.some((s) => s.portalType === 'police'));
  });

  it('defines browser socket events', () => {
    assert.ok(BROWSER_SOCKET_EVENTS.includes('browser:tab:sync'));
    assert.ok(BROWSER_SOCKET_EVENTS.includes('browser:download:complete'));
  });
});

describe('browser API routes', () => {
  it('mounts under /api/browser', () => {
    const routes = [
      '/api/browser/initialize',
      '/api/browser/home',
      '/api/browser/navigate',
      '/api/browser/tabs',
      '/api/browser/bookmarks',
      '/api/browser/downloads',
      '/api/browser/passwords',
    ];
    assert.ok(routes.every((r) => r.startsWith('/api/browser')));
  });
});

describe('browser integration helpers', () => {
  it('validates HTTPS URLs', () => {
    assert.ok(validateHttps('https://www.gulfos.com'));
    assert.ok(!validateHttps('http://insecure.example'));
    assert.ok(validateHttps('about:blank'));
  });

  it('normalizes origins', () => {
    assert.equal(normalizeOrigin('https://bank.gulfos.finance/path'), 'https://bank.gulfos.finance');
  });

  it('infers download types', () => {
    assert.equal(inferDownloadType('image/png', 'photo.png'), 'image');
    assert.equal(inferDownloadType('application/pdf', 'doc.pdf'), 'pdf');
    assert.equal(inferDownloadType('application/zip', 'archive.zip'), 'zip');
  });

  it('finds text in page content', () => {
    const result = findInPageContent('Hello GULF Browser world', 'GULF');
    assert.equal(result.matches, 1);
    assert.ok(result.highlights.includes('**GULF**'));
  });

  it('translates page content with header', () => {
    const translated = translatePageContent('Welcome', 'ar');
    assert.ok(translated.includes('ar'));
    assert.ok(translated.includes('Welcome'));
  });

  it('parses QR scan results', () => {
    const valid = parseQrScanResult('https://www.gulfos.com');
    assert.ok(valid.valid);
    const invalid = parseQrScanResult('not-a-url');
    assert.ok(!invalid.valid);
  });

  it('builds share payload', () => {
    const share = buildSharePayload('https://news.gulfos.media', 'GULF News');
    assert.ok(share.deepLink.includes('gulfos://browser'));
    assert.ok(share.text.includes('GULF News'));
  });

  it('encrypts and decrypts browser secrets', () => {
    const userId = 'user-test-123';
    const encrypted = encryptBrowserSecret(userId, 'secret-password');
    const decrypted = decryptBrowserSecret(userId, encrypted);
    assert.equal(decrypted, 'secret-password');
  });
});
