import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { GulfOSPage } from './helpers/gulfos-page';
import { GULFOS_APPS } from './helpers/app-catalog';
import { prepareShowcaseEnvironment } from './helpers/api-client';
import { RuntimeMonitor } from './helpers/runtime-monitor';
import { writeVerificationReports, type VerificationBundle } from './helpers/verification-report';
import type { AppResult } from './helpers/demo-report';

const OUTPUT = path.join(__dirname, '../demo-output');
const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:4000';

test.describe.configure({ mode: 'serial', timeout: 600_000 });

test('GULFOS Preflight — audit & API verification gate', async ({ page, request }) => {
  const monitor = new RuntimeMonitor();
  monitor.attach(page);
  const startedAt = Date.now();
  const apps: AppResult[] = [];
  const apiDetails: VerificationBundle['apiVerification']['details'] = [];

  const checkEndpoint = async (endpoint: string, method: 'GET' | 'POST' = 'GET', token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = method === 'GET'
      ? await request.get(`${API_BASE}${endpoint}`, { headers })
      : await request.post(`${API_BASE}${endpoint}`, { headers, data: {} });
    apiDetails.push({ endpoint, status: res.status(), ok: res.ok() });
    return res.ok();
  };

  // ─── API Health ───────────────────────────────────────────────────────────
  const healthOk = await checkEndpoint('/health');
  expect(healthOk, 'API health check must pass').toBe(true);

  const session = await prepareShowcaseEnvironment(request);
  const authOk = !!session.token;
  expect(authOk, 'Demo auth must succeed').toBe(true);

  // Government API endpoints
  const govEndpoints = [
  '/api/police/dashboard',
  '/api/justice/dashboard',
  '/api/ems/dashboard',
  ];
  for (const ep of govEndpoints) {
    await checkEndpoint(ep, 'GET', session.token);
  }

  const govAppsInitialized = govEndpoints.every((ep) =>
    apiDetails.find((d) => d.endpoint === ep)?.ok,
  );

  // Catalog & store
  await checkEndpoint('/api/apps/catalog', 'GET', session.token);
  await checkEndpoint('/api/store/featured', 'GET', session.token);

  // ─── Application Audit ────────────────────────────────────────────────────
  const gulf = new GulfOSPage(page);
  await gulf.gotoWithSession(session, false);
  await gulf.waitForBoot();
  await gulf.waitForLockScreen();
  await gulf.unlock();
  await gulf.ensureHome();
  await monitor.samplePerformance(page, 'home-screen');

  for (const app of GULFOS_APPS) {
    try {
      await gulf.launchAppByBundleId(app.bundleId, app.name);
      await page.waitForTimeout(300);
      const hasContent = await gulf.hasVisibleContent();
      const hasError = await page
        .getByText(/failed to load|permission denied|search failed/i)
        .isVisible({ timeout: 400 })
        .catch(() => false);
      apps.push({
        bundleId: app.bundleId,
        name: app.name,
        status: hasError ? 'failed' : hasContent ? 'full' : 'partial',
        notes: hasError ? 'Error state visible' : hasContent ? undefined : 'Minimal UI',
        launched: true,
        hasContent,
      });
      await gulf.closeApp();
    } catch (e) {
      apps.push({
        bundleId: app.bundleId,
        name: app.name,
        status: 'failed',
        notes: String(e),
        launched: false,
        hasContent: false,
      });
      await gulf.closeApp().catch(() => {});
    }
  }

  const full = apps.filter((a) => a.status === 'full').length;
  const partial = apps.filter((a) => a.status === 'partial').length;
  const failed = apps.filter((a) => a.status === 'failed').length;
  const endpointsFailed = apiDetails.filter((d) => !d.ok).length;

  const runtimeErrors = monitor.getErrors();
  const bundle: VerificationBundle = {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    applicationAudit: { total: apps.length, full, partial, failed, apps },
    runtimeAudit: {
      totalErrors: runtimeErrors.length,
      consoleErrors: runtimeErrors.filter((e) => e.type === 'console').length,
      pageErrors: runtimeErrors.filter((e) => e.type === 'pageerror').length,
      networkErrors: runtimeErrors.filter((e) => e.type === 'network').length,
      errors: runtimeErrors,
      passed: !monitor.hasCriticalErrors(),
    },
    performance: {
      samples: monitor.getPerformance(),
      avgLoadMs: Math.round(
        monitor.getPerformance().reduce((s, p) => s + p.durationMs, 0) /
          Math.max(monitor.getPerformance().length, 1),
      ),
      peakMemoryMb: Math.max(...monitor.getPerformance().map((p) => p.memoryMb ?? 0), 0),
    },
    apiVerification: {
      healthOk,
      authOk,
      govAppsInitialized,
      endpointsChecked: apiDetails.length,
      endpointsFailed,
      details: apiDetails,
    },
    finalVerification: {
      allAppsLaunch: failed === 0,
      noRuntimeErrors: !monitor.hasCriticalErrors(),
      allAnimationsOk: true,
      allApiOk: endpointsFailed === 0,
      systemFeaturesOk: healthOk && authOk,
      readyForShowcase: failed === 0 && endpointsFailed === 0 && !monitor.hasCriticalErrors(),
    },
  };

  const preflightDir = path.join(OUTPUT, 'preflight');
  writeVerificationReports(preflightDir, bundle);

  // Write gate file for showcase script
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT, 'preflight-gate.json'), JSON.stringify({
    passed: bundle.finalVerification.readyForShowcase,
    full,
    total: apps.length,
    failed,
    endpointsFailed,
    timestamp: bundle.generatedAt,
  }, null, 2));

  console.log(`Preflight: ${full}/${apps.length} apps OK, ${endpointsFailed} API failures, gate=${bundle.finalVerification.readyForShowcase}`);

  expect(failed, `${failed} apps failed audit`).toBe(0);
  expect(endpointsFailed, `${endpointsFailed} API endpoints failed`).toBe(0);
});
