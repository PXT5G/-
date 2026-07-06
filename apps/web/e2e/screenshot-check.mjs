import { chromium } from '@playwright/test';

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__GULFOS_E2E__, undefined, { timeout: 30000 });
  // lock screen
  await page.waitForFunction(() => window.__GULFOS_E2E__?.getPhase() === 'locked', undefined, { timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/ios-check-lock.png' });
  // unlock
  await page.evaluate(() => window.__GULFOS_E2E__?.unlock());
  await page.waitForTimeout(1800);
  await page.screenshot({ path: '/tmp/ios-check-home.png' });
  // control center
  await page.evaluate(() => window.__GULFOS_E2E__?.openControlCenter());
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/ios-check-cc.png' });
  await page.evaluate(() => window.__GULFOS_E2E__?.closeAllPanels());
  // notification center
  await page.evaluate(() => window.__GULFOS_E2E__?.openNotificationCenter());
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/ios-check-nc.png' });
  await page.evaluate(() => window.__GULFOS_E2E__?.closeAllPanels());
  // settings app
  await page.evaluate(() => window.__GULFOS_E2E__?.launchApp('com.gulfos.settings', 'Settings'));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/ios-check-settings.png' });
  await browser.close();
  console.log('done');
};
run().catch((e) => { console.error(e); process.exit(1); });
