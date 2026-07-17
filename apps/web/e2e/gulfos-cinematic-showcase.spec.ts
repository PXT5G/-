import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { GulfOSPage } from './helpers/gulfos-page';
import { GULFOS_APPS } from './helpers/app-catalog';
import { prepareShowcaseEnvironment } from './helpers/api-client';

const OUTPUT = path.join(__dirname, '../demo-output');

test.describe.configure({ mode: 'serial', timeout: 1_800_000 });

test('GULFOS Cinematic Showcase — boot to shutdown', async ({ page, request }) => {
  const gulf = new GulfOSPage(page);
  const session = await prepareShowcaseEnvironment(request);

  // ─── Boot ─────────────────────────────────────────────────────────────────
  await gulf.goto(true);
  await gulf.waitForSplash();
  await gulf.pause(2000);
  await gulf.waitForBoot();
  await gulf.pause(1500);

  // ─── Lock & Unlock ────────────────────────────────────────────────────────
  await gulf.waitForLockScreen();
  await gulf.pause(1500);
  await gulf.unlock();
  await gulf.pause(2000);

  // ─── Home & Widgets ───────────────────────────────────────────────────────
  await gulf.ensureHome();
  await gulf.pause(2000);

  // ─── Notification Center ──────────────────────────────────────────────────
  await gulf.openNotificationCenter();
  await gulf.pause(2000);
  await gulf.closeAllPanels();
  await gulf.pause(800);

  // ─── Control Center ───────────────────────────────────────────────────────
  await gulf.openControlCenter();
  await gulf.pause(2000);
  await gulf.closeAllPanels();
  await gulf.pause(800);

  // ─── Global Search ──────────────────────────────────────────────────────────
  await gulf.openSearch();
  await page.getByLabel('Global search').fill('Settings');
  await gulf.pause(1500);
  await page.getByText('Cancel').click({ timeout: 3_000 }).catch(() => gulf.closeAllPanels());
  await gulf.pause(800);

  // ─── Dynamic Island ───────────────────────────────────────────────────────
  const island = page.getByRole('status', { name: 'Dynamic Island' });
  if (await island.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await island.click({ timeout: 5_000 }).catch(() => {});
    await gulf.pause(1500);
  }

  // ─── App Library ──────────────────────────────────────────────────────────
  await gulf.openAppLibrary();
  await gulf.pause(2000);
  await gulf.closeAllPanels();
  await gulf.pause(800);

  // ─── Multitasking ─────────────────────────────────────────────────────────
  await gulf.launchAppByBundleId('com.gulfos.phone', 'Phone');
  await gulf.pause(1500);
  await page.evaluate(() => window.__GULFOS_E2E__?.openMultitasking());
  await gulf.pause(2000);
  await page.getByText('Done').click({ timeout: 3_000 }).catch(() => gulf.closeAllPanels());
  await gulf.closeApp();
  await gulf.pause(800);

  // ─── Settings: Wallpaper & Theme ─────────────────────────────────────────
  await gulf.launchFromDock('Settings');
  await gulf.pause(1500);
  await page.getByText('Wallpaper').click({ timeout: 5_000 }).catch(() => {});
  await gulf.pause(1200);
  await page.getByText('Gulf Gradient').click({ timeout: 3_000 }).catch(() => page.getByText('Midnight').click({ timeout: 2_000 }).catch(() => {}));
  await gulf.pause(1500);
  await page.getByText('‹ Back').click({ timeout: 3_000 }).catch(() => {});
  await page.getByText('Display').click({ timeout: 5_000 }).catch(() => {});
  await gulf.pause(1200);
  await page.getByRole('button', { name: 'dark' }).click({ timeout: 3_000 }).catch(() => {});
  await gulf.pause(1500);
  await gulf.closeApp();

  // ─── Gulf Store flow ───────────────────────────────────────────────────────
  await gulf.launchFromDock('GULF Store');
  await gulf.pause(2000);
  await page.getByText('Updates').click({ timeout: 4_000 }).catch(() => {});
  await gulf.pause(1500);
  await page.getByText('Featured').click({ timeout: 4_000 }).catch(() => {});
  await gulf.pause(1500);
  await gulf.closeApp();

  // ─── Auth for government apps ──────────────────────────────────────────────
  await gulf.seedSession(session);
  await gulf.waitForSplash().catch(() => {});
  await gulf.waitForBoot();
  await gulf.unlock();
  await gulf.pause(1500);

  // ─── Every registered application ─────────────────────────────────────────
  for (const app of GULFOS_APPS) {
    await gulf.browseApp(app.bundleId, app.name, 4000);
  }

  // ─── Core communication flow ───────────────────────────────────────────────
  await gulf.launchAppByBundleId('com.gulfos.phone', 'Phone');
  await gulf.pause(2500);
  await gulf.closeApp();
  await gulf.launchAppByBundleId('com.gulfos.messages', 'Messages');
  await gulf.pause(2500);
  await gulf.closeApp();
  await gulf.launchAppByBundleId('com.gulfos.contacts', 'Contacts');
  await gulf.pause(2500);
  await gulf.closeApp();

  // ─── Camera & Gallery ───────────────────────────────────────────────────────
  await gulf.launchAppByBundleId('com.gulfos.camera', 'Camera');
  await gulf.pause(2000);
  const shutter = page.locator('button').filter({ has: page.locator('.rounded-full.bg-white, .rounded-full.bg-red-500') }).last();
  if (await shutter.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await shutter.click();
    await gulf.pause(1500);
  }
  await gulf.closeApp();
  await gulf.launchAppByBundleId('com.gulfos.gallery', 'Gallery');
  await gulf.pause(2500);
  await gulf.closeApp();

  // ─── Government apps (extended dwell) ───────────────────────────────────────
  for (const [id, name] of [
    ['com.gulfos.police', 'GULF Police'],
    ['com.gulfos.justice', 'GULF Justice'],
    ['com.gulfos.ems', 'GULF EMS'],
  ] as const) {
    await gulf.launchAppByBundleId(id, name);
    await gulf.pause(5000);
    const tabs = page.getByRole('button').filter({ hasText: /MDT|Units|Dispatch|Docket|Cases|Patients/i });
    const count = await tabs.count();
    for (let i = 0; i < Math.min(count, 4); i++) {
      await tabs.nth(i).click({ timeout: 3_000 }).catch(() => {});
      await gulf.pause(2000);
    }
    await gulf.closeApp();
  }

  // ─── Final home ────────────────────────────────────────────────────────────
  await gulf.ensureHome();
  await gulf.pause(2000);

  // ─── Shutdown ──────────────────────────────────────────────────────────────
  await gulf.shutdown();
  await gulf.pause(2000);

  // Copy raw recording for ffmpeg post-process
  try {
    const walk = (dir: string): string | null => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const found = walk(full);
          if (found) return found;
        } else if (entry.name === 'video.webm') return full;
      }
      return null;
    };
    const resultsDir = path.join(OUTPUT, 'showcase-results');
    if (fs.existsSync(resultsDir)) {
      const videoPath = walk(resultsDir);
      if (videoPath) {
        fs.mkdirSync(OUTPUT, { recursive: true });
        fs.copyFileSync(videoPath, path.join(OUTPUT, 'gulfos-showcase-raw.webm'));
      }
    }
  } catch { /* optional */ }
});
