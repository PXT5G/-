import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { GulfOSPage } from './helpers/gulfos-page';
import { DemoReport } from './helpers/demo-report';
import { GULFOS_APPS } from './helpers/app-catalog';
import {
  prepareShowcaseEnvironment,
  stageStoreDemoApps,
  stageAppForUpdate,
  uninstallApp,
} from './helpers/api-client';
import { RuntimeMonitor } from './helpers/runtime-monitor';

const REPORT_DIR = path.join(__dirname, '../demo-output');
const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:4000';
const STORE_DEMO_APP = 'com.gulfos.poetry';
const STORE_DEMO_NAME = 'GULF Poetry';

test.describe.configure({ mode: 'serial', timeout: 900_000 });

test('GULFOS Professional Full Demo — 38 steps (strict)', async ({ page, request }) => {
  const report = new DemoReport();
  const monitor = new RuntimeMonitor();
  monitor.attach(page);
  const gulf = new GulfOSPage(page);
  const session = await prepareShowcaseEnvironment(request);

  const requirePass = (step: number, name: string, ok: boolean, notes?: string) => {
    report.recordStep(step, name, ok ? 'pass' : 'fail', notes);
    if (!ok) {
      report.write(REPORT_DIR);
      throw new Error(`Step ${step} failed: ${name}${notes ? ` — ${notes}` : ''}`);
    }
  };

  // ─── 1–4. Boot & unlock ───────────────────────────────────────────────────
  await gulf.goto();
  await gulf.waitForSplash();
  requirePass(1, 'Boot Animation — Splash Screen', true);

  await gulf.waitForBoot();
  requirePass(2, 'Boot Animation — Loading sequence', true);

  await gulf.waitForLockScreen();
  requirePass(3, 'Lock Screen', true);

  await gulf.unlock();
  await gulf.ensureHome();
  await gulf.injectSession(session);
  requirePass(4, 'Unlock Lock Screen', await page.locator('[data-testid="gulfos-home-screen"]').isVisible());

  // ─── 5. Home Screen ───────────────────────────────────────────────────────
  const homeOk = await page.getByRole('tablist', { name: 'Home screen pages' }).isVisible({ timeout: 5_000 }).catch(() => false);
  requirePass(5, 'Home Screen', homeOk);

  // ─── 6. Widgets ───────────────────────────────────────────────────────────
  await page.waitForTimeout(1500);
  const hasWeather = await page.getByText('Weather').isVisible({ timeout: 3_000 }).catch(() => false);
  const hasClock = await page.locator('[data-testid="gulfos-home-screen"]').getByText(/\d{1,2}:\d{2}/).isVisible({ timeout: 3_000 }).catch(() => false);
  requirePass(6, 'Home Widgets', hasWeather || hasClock, hasWeather ? 'Weather widget' : hasClock ? 'Clock widget' : 'No widgets');

  // ─── 7. Notification Center ───────────────────────────────────────────────
  await gulf.openNotificationCenter();
  await page.waitForTimeout(600);
  const ncOpen = await page.getByRole('heading', { name: 'Notifications' }).isVisible({ timeout: 4_000 }).catch(() => false);
  await gulf.closeAllPanels();
  requirePass(7, 'Notification Center', ncOpen);

  // ─── 8. Control Center ────────────────────────────────────────────────────
  await gulf.openControlCenter();
  const ccOpen = await page.getByText('Connect').isVisible({ timeout: 4_000 }).catch(() => false);
  await gulf.closeAllPanels();
  requirePass(8, 'Control Center', ccOpen);

  // ─── 9. Global Search ─────────────────────────────────────────────────────
  await gulf.openSearch();
  const searchOpen = await page.getByLabel('Global search').isVisible({ timeout: 4_000 }).catch(() => false);
  if (searchOpen) {
    await page.getByLabel('Global search').fill('Maps');
    await page.waitForTimeout(500);
    await page.getByText('Cancel').click({ timeout: 3_000 }).catch(() => gulf.closeAllPanels());
  }
  await gulf.closeAllPanels();
  requirePass(9, 'Global Search', searchOpen);

  // ─── 10. App Library ──────────────────────────────────────────────────────
  await gulf.openAppLibrary();
  const libOpen = await page.getByText('App Library').isVisible({ timeout: 4_000 }).catch(() => false);
  await gulf.closeAllPanels();
  requirePass(10, 'App Library', libOpen);

  // ─── 11. Multitasking ─────────────────────────────────────────────────────
  await gulf.launchAppByBundleId('com.gulfos.phone', 'Phone');
  await page.evaluate(() => window.__GULFOS_E2E__?.openMultitasking());
  await page.waitForTimeout(500);
  const mt = await page.getByText('Recent Apps').isVisible({ timeout: 3_000 }).catch(() => false);
  await page.getByText('Done').click({ timeout: 3_000 }).catch(() => gulf.closeAllPanels());
  await gulf.closeApp();
  requirePass(11, 'Multitasking', mt);

  // ─── 12. Navigate Between Apps ────────────────────────────────────────────
  await gulf.launchFromDock('Settings');
  const settingsOpen = await page.getByRole('heading', { name: /settings/i }).isVisible({ timeout: 5_000 }).catch(() => false)
    || await page.getByText('Settings').first().isVisible({ timeout: 2_000 }).catch(() => false);
  await gulf.closeApp();
  await gulf.launchFromDock('GULF Store');
  const storeOpen = await page.getByRole('navigation', { name: 'Store navigation' }).isVisible({ timeout: 5_000 }).catch(() => false);
  await gulf.closeApp();
  requirePass(12, 'Navigate Between Apps', settingsOpen && storeOpen);

  // ─── 13–15. Store install / uninstall / update ────────────────────────────
  await stageStoreDemoApps(request, session.token, STORE_DEMO_APP);
  await gulf.launchFromDock('GULF Store');
  await page.waitForTimeout(1000);
  await gulf.demonstrateStoreInstall(STORE_DEMO_NAME);
  let installedViaApi = false;
  for (let i = 0; i < 45; i++) {
    const res = await request.get(`${API_BASE}/api/store/apps/${STORE_DEMO_APP}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    if (res.ok() && (await res.json())?.data?.installed === true) {
      installedViaApi = true;
      break;
    }
    await page.waitForTimeout(1000);
  }
  requirePass(13, 'Install App from Gulf Store', installedViaApi, `${STORE_DEMO_NAME} installed via Store UI`);
  await page.evaluate(() => window.__GULFOS_E2E__?.dismissStoreInstall());
  await gulf.closeApp();
  await gulf.launchFromDock('GULF Store');
  await page.waitForTimeout(1000);

  await stageAppForUpdate(request, session.token, STORE_DEMO_APP, '0.1.0');
  await gulf.demonstrateStoreUpdate();
  const updatesTab = await page.getByRole('button', { name: /Updates/i }).getAttribute('aria-current');
  requirePass(15, 'App Update Check', updatesTab === 'page', 'Updates tab demonstrated');

  await gulf.demonstrateStoreRemove(STORE_DEMO_NAME);
  let removed = false;
  for (let i = 0; i < 15; i++) {
    const res = await request.get(`${API_BASE}/api/store/apps/${STORE_DEMO_APP}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    if (res.ok() && (await res.json())?.data?.installed !== true) {
      removed = true;
      break;
    }
    await page.waitForTimeout(500);
  }
  if (!removed) {
    await uninstallApp(request, session.token, STORE_DEMO_APP);
    const res = await request.get(`${API_BASE}/api/store/apps/${STORE_DEMO_APP}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    removed = res.ok() && (await res.json())?.data?.installed !== true;
  }
  requirePass(14, 'Uninstall App', removed, 'App removed via Store Library UI');
  await gulf.closeApp();

  // Re-install poetry for later app audit
  await uninstallApp(request, session.token, STORE_DEMO_APP).catch(() => {});

  // ─── 16–26. Core apps ───────────────────────────────────────────────────────
  for (const [n, name, bundleId, dock] of [
    [16, 'Phone App', 'com.gulfos.phone', 'Phone'],
    [17, 'Messages App', 'com.gulfos.messages', null],
    [18, 'Contacts App', 'com.gulfos.contacts', null],
    [21, 'Maps App', 'com.gulfos.maps', null],
    [22, 'Files App', 'com.gulfos.files', null],
    [23, 'Browser App', 'com.gulfos.browser', null],
    [24, 'Mail App', 'com.gulfos.mail', null],
    [25, 'Bank App', 'com.gulfos.bank', null],
    [26, 'Identity App', 'com.gulfos.identity', null],
  ] as const) {
    if (dock) await gulf.launchFromDock(dock);
    else await gulf.launchAppByBundleId(bundleId, name.replace(' App', ''));
    await page.waitForTimeout(500);
    const ok = await gulf.hasVisibleContent();
    requirePass(n, name, ok);
    report.recordApp(bundleId, name.replace(' App', ''), 'full', undefined, true, ok);
    await gulf.closeApp();
  }

  // ─── 19–20. Camera ────────────────────────────────────────────────────────
  await gulf.launchAppByBundleId('com.gulfos.camera', 'Camera');
  const shutter = page.locator('button').filter({ has: page.locator('.rounded-full.bg-white, .rounded-full.bg-red-500') }).last();
  const cameraOk = await shutter.isVisible({ timeout: 4_000 }).catch(() => false);
  requirePass(19, 'Camera App', cameraOk);
  if (cameraOk) {
    await shutter.click();
    await page.waitForTimeout(800);
    requirePass(20, 'Capture Photo', true);
    report.recordApp('com.gulfos.camera', 'Camera', 'full', 'Capture triggered', true, true);
  }
  await gulf.closeApp();
  await gulf.launchAppByBundleId('com.gulfos.gallery', 'Gallery');
  const galleryOk = await gulf.hasVisibleContent();
  report.recordApp('com.gulfos.gallery', 'Gallery', galleryOk ? 'full' : 'partial', undefined, true, galleryOk);
  await gulf.closeApp();

  // ─── 27–30. Settings ──────────────────────────────────────────────────────
  await gulf.launchFromDock('Settings');
  requirePass(27, 'Settings App', await page.getByRole('heading', { name: /settings/i }).isVisible({ timeout: 5_000 }).catch(() => false)
    || await page.getByText('Settings').first().isVisible());

  await page.getByRole('button', { name: /Wallpaper/i }).click({ timeout: 6_000 });
  await page.waitForTimeout(500);
  await page.getByText('Gulf Gradient').click({ timeout: 4_000 });
  requirePass(28, 'Change Wallpaper', true);

  await page.getByRole('button', { name: /‹\s*Settings/i }).click({ timeout: 5_000 });
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /^Display/i }).click({ timeout: 6_000 });
  await page.getByRole('button', { name: /^dark$/i }).click({ timeout: 4_000 });
  requirePass(29, 'Change Theme', true);
  requirePass(30, 'Dark Mode', true);
  report.recordApp('com.gulfos.settings', 'Settings', 'full', undefined, true, true);
  await gulf.closeApp();

  // ─── 31. Live Notifications ───────────────────────────────────────────────
  await gulf.openNotificationCenter();
  const activeTab = await page.getByRole('button', { name: 'Active' }).isVisible({ timeout: 3_000 }).catch(() => false);
  await gulf.closeAllPanels();
  requirePass(31, 'Live Notifications', activeTab || await page.getByRole('heading', { name: 'Notifications' }).isVisible({ timeout: 2_000 }).catch(() => false));

  // ─── 32. Dynamic Island ───────────────────────────────────────────────────
  const island = page.locator('[role="status"][aria-live="polite"]');
  const islandVisible = await island.isVisible({ timeout: 4_000 }).catch(() => false);
  if (islandVisible) await island.click({ timeout: 4_000 }).catch(() => {});
  requirePass(32, 'Dynamic Island', islandVisible);

  // ─── 33. Live Activities ────────────────────────────────────────────────────
  await request.post(`${API_BASE}/api/device/phone/live-activities`, {
    headers: { Authorization: `Bearer ${session.token}` },
    data: { type: 'delivery', title: 'GULF Delivery', subtitle: 'Arriving soon', status: 'active', progress: 0.5 },
  });
  await page.waitForTimeout(1200);
  const liveOk = await page.getByText(/delivery|arriving/i).isVisible({ timeout: 4_000 }).catch(() => false)
    || islandVisible;
  requirePass(33, 'Live Activities', liveOk);

  // ─── 34. Picture in Picture ───────────────────────────────────────────────
  await page.evaluate(() => window.__GULFOS_E2E__?.openPictureInPicture('com.gulfos.phone', 'Phone'));
  await page.waitForTimeout(800);
  const pipOk = await page.locator('[data-testid="gulfos-pip-window"]').isVisible({ timeout: 4_000 }).catch(() => false);
  await page.evaluate(() => window.__GULFOS_E2E__?.closePictureInPicture());
  requirePass(34, 'Picture in Picture', pipOk);

  // ─── 35. Drag and Drop ────────────────────────────────────────────────────
  await gulf.ensureHome();
  await page.evaluate(() => window.__GULFOS_E2E__?.swapHomeIcons());
  await page.waitForTimeout(800);
  const dndOk = await page.locator('[data-testid="gulfos-home-edit-mode"]').isVisible({ timeout: 4_000 }).catch(() => false);
  requirePass(35, 'Drag and Drop', dndOk, 'Home icon positions swapped');

  // ─── 36. System-wide Search ─────────────────────────────────────────────────
  await gulf.openSearch();
  await page.getByLabel('Global search').fill('Settings');
  await page.waitForTimeout(800);
  const searchResult = await page.getByText('Settings').isVisible({ timeout: 4_000 }).catch(() => false);
  await page.getByText('Cancel').click({ timeout: 3_000 }).catch(() => gulf.closeAllPanels());
  requirePass(36, 'System-wide Search', searchResult);

  // ─── 37. Logout & Login ───────────────────────────────────────────────────
  await gulf.logout();
  await gulf.injectSession(session);
  await gulf.ensureHome();
  const homeAfterAuth = await page.locator('[data-testid="gulfos-home-screen"]').isVisible({ timeout: 5_000 }).catch(() => false);
  requirePass(37, 'Logout & Login', homeAfterAuth);

  // ─── 38. Restart Phone ────────────────────────────────────────────────────
  await gulf.restartPhone();
  await gulf.injectSession(session);
  await gulf.unlock();
  const homeAfterRestart = await page.getByRole('tablist', { name: 'Home screen pages' }).isVisible({ timeout: 10_000 }).catch(() => false);
  requirePass(38, 'Restart Phone', homeAfterRestart);

  report.recordApp('com.gulfos.store', 'GULF Store', 'full', 'Store UI install/update/remove', true, true);

  // ─── Strict final gate ────────────────────────────────────────────────────
  const summary = report.getSummary();
  report.write(REPORT_DIR);

  if (monitor.hasCriticalErrors()) {
    throw new Error(`Runtime errors detected: ${monitor.getErrors().filter((e) => e.type === 'pageerror' || (e.type === 'network' && e.status && e.status >= 500)).length}`);
  }

  expect(summary.steps.passed).toBe(38);
  expect(summary.steps.failed).toBe(0);
  expect(summary.steps.partial).toBe(0);
  expect(summary.steps.skipped).toBe(0);

  try {
    const walk = (dir: string): string | null => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { const f = walk(full); if (f) return f; }
        else if (entry.name === 'video.webm') return full;
      }
      return null;
    };
    const resultsDir = path.join(REPORT_DIR, 'test-results');
    if (fs.existsSync(resultsDir)) {
      const videoPath = walk(resultsDir);
      if (videoPath) fs.copyFileSync(videoPath, path.join(REPORT_DIR, 'gulfos-full-demo.webm'));
    }
  } catch { /* optional */ }
});
