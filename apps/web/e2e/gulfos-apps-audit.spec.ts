import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { GulfOSPage } from './helpers/gulfos-page';
import { DemoReport } from './helpers/demo-report';
import { GULFOS_APPS } from './helpers/app-catalog';
import { ensureDemoUser } from './helpers/api-client';

const REPORT_DIR = path.join(__dirname, '../demo-output');

test.describe.configure({ mode: 'serial', timeout: 600_000 });

test('GULFOS Apps Audit — all registered apps', async ({ page, request }) => {
  const report = new DemoReport();
  const gulf = new GulfOSPage(page);

  try {
    await ensureDemoUser(request);
    await gulf.goto();
    await gulf.waitForBoot();
    await gulf.waitForLockScreen();
    await gulf.unlock();
    await gulf.ensureHome();

    for (const app of GULFOS_APPS) {
      try {
        await gulf.launchAppByBundleId(app.bundleId, app.name);
        await page.waitForTimeout(200);
        const hasContent = await gulf.hasVisibleContent();
        const hasError = await page.getByText(/error|failed|not found/i).isVisible({ timeout: 300 }).catch(() => false);
        report.recordApp(
          app.bundleId,
          app.name,
          hasError ? 'failed' : hasContent ? 'full' : 'partial',
          hasError ? 'Error state' : hasContent ? undefined : 'Minimal UI',
          true,
          hasContent,
        );
        await gulf.closeApp();
      } catch (e) {
        report.recordApp(app.bundleId, app.name, 'failed', String(e), false, false);
        await gulf.closeApp().catch(() => {});
      }
    }

    const summary = report.write(path.join(REPORT_DIR, 'apps-audit'));
    console.log(`Apps audit: ${summary.apps.full}/${summary.apps.total} fully working`);
    expect(summary.apps.total).toBe(GULFOS_APPS.length);
  } finally {
    report.write(path.join(REPORT_DIR, 'apps-audit'));
  }
});
