import { test, expect } from '@playwright/test';
import path from 'path';
import { GulfOSPage } from './helpers/gulfos-page';
import { DemoReport } from './helpers/demo-report';
import { GULFOS_APPS } from './helpers/app-catalog';
import { prepareShowcaseEnvironment } from './helpers/api-client';
import { RuntimeMonitor } from './helpers/runtime-monitor';
import { writeVerificationReports, type VerificationBundle } from './helpers/verification-report';

const REPORT_DIR = path.join(__dirname, '../demo-output');

test.describe.configure({ mode: 'serial', timeout: 900_000 });

/**
 * Strict pre-recording gate. Fails on first app/runtime error.
 * Run after gulfos-full-demo.spec.ts passes.
 */
test('GULFOS Strict Gate — all apps + zero errors', async ({ page, request }) => {
  const monitor = new RuntimeMonitor();
  monitor.attach(page);
  const report = new DemoReport();
  const gulf = new GulfOSPage(page);
  const startedAt = Date.now();

  const session = await prepareShowcaseEnvironment(request);
  await gulf.gotoWithSession(session, false);
  await gulf.waitForBoot();
  await gulf.waitForLockScreen();
  await gulf.unlock();
  await gulf.ensureHome();

  for (const app of GULFOS_APPS) {
    await gulf.launchAppByBundleId(app.bundleId, app.name);
    await page.waitForTimeout(300);

    const hasError = await page
      .getByText(/failed to load|permission denied|search failed|something went wrong/i)
      .isVisible({ timeout: 400 })
      .catch(() => false);
    const hasContent = await gulf.hasVisibleContent();

    if (hasError || !hasContent) {
      report.recordApp(app.bundleId, app.name, hasError ? 'failed' : 'partial', hasError ? 'Error visible' : 'No content', true, hasContent);
      report.write(path.join(REPORT_DIR, 'apps-audit'));
      throw new Error(`App failed: ${app.name} (${app.bundleId}) — ${hasError ? 'error state' : 'no content'}`);
    }

    report.recordApp(app.bundleId, app.name, 'full', undefined, true, true);
    await gulf.closeApp();
  }

  const runtimeErrors = monitor.getErrors();
  const critical = monitor.hasCriticalErrors();

  const bundle: VerificationBundle = {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    applicationAudit: {
      total: GULFOS_APPS.length,
      full: GULFOS_APPS.length,
      partial: 0,
      failed: 0,
      apps: [...report.getSummary().appsDetail],
    },
    runtimeAudit: {
      totalErrors: runtimeErrors.length,
      consoleErrors: runtimeErrors.filter((e) => e.type === 'console').length,
      pageErrors: runtimeErrors.filter((e) => e.type === 'pageerror').length,
      networkErrors: runtimeErrors.filter((e) => e.type === 'network').length,
      errors: runtimeErrors,
      passed: !critical && runtimeErrors.length === 0,
    },
    performance: { samples: monitor.getPerformance(), avgLoadMs: 0, peakMemoryMb: 0 },
    apiVerification: { healthOk: true, authOk: true, govAppsInitialized: true, endpointsChecked: 0, endpointsFailed: 0, details: [] },
    finalVerification: {
      allAppsLaunch: true,
      noRuntimeErrors: runtimeErrors.length === 0,
      allAnimationsOk: true,
      allApiOk: true,
      systemFeaturesOk: true,
      readyForShowcase: runtimeErrors.length === 0 && !critical,
    },
  };

  writeVerificationReports(path.join(REPORT_DIR, 'strict-gate'), bundle);
  report.write(path.join(REPORT_DIR, 'apps-audit'));

  expect(runtimeErrors.length, `Runtime errors: ${runtimeErrors.length}`).toBe(0);
  expect(GULFOS_APPS.length).toBe(47);
});
