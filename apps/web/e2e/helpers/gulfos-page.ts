import { type Page, type Locator, expect } from '@playwright/test';
import { DEMO_CREDENTIALS } from './app-catalog';
import type { DemoSession } from './api-client';

export class GulfOSPage {
  readonly frame: Locator;

  constructor(private page: Page) {
    this.frame = page.getByRole('application', { name: 'GULFOS' });
  }

  async pause(ms = 1200) {
    await this.page.waitForTimeout(ms);
  }

  async waitForBridge() {
    await this.page.waitForFunction(() => !!window.__GULFOS_E2E__, undefined, { timeout: 45_000 });
  }

  async goto(cinema = false) {
    await this.page.addInitScript(() => {
      localStorage.removeItem('bananaos-os');
      localStorage.removeItem('bananaos-lock');
      localStorage.removeItem('bananaos-auth');
    });
    const url = cinema ? '/?cinema=1' : '/';
    await this.page.goto(url, { waitUntil: 'load' });
    await this.frame.waitFor({ state: 'visible', timeout: 30_000 });
    await this.page.getByText('GULFOS').first().waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
    await this.waitForBridge();
  }

  async gotoWithSession(session: DemoSession, cinema = false) {
    await this.page.addInitScript(
      ({ token, user }) => {
        localStorage.removeItem('bananaos-os');
        localStorage.removeItem('bananaos-lock');
        localStorage.setItem(
          'bananaos-auth',
          JSON.stringify({
            state: {
              user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
              },
              tokens: { accessToken: token, refreshToken: token },
              isAuthenticated: true,
              isLoading: false,
            },
            version: 0,
          }),
        );
      },
      { token: session.token, user: session.user },
    );
    const url = cinema ? '/?cinema=1' : '/';
    await this.page.goto(url, { waitUntil: 'load' });
    await this.frame.waitFor({ state: 'visible', timeout: 30_000 });
    await this.waitForBridge();
  }

  async seedSession(session: DemoSession, cinema = true) {
    await this.gotoWithSession(session, cinema);
  }

  async waitForSplash() {
    await expect(this.page.getByText('Premium Mobile Experience')).toBeVisible({ timeout: 8_000 });
  }

  async waitForBoot() {
    await expect(this.page.getByText('Starting GULFOS...')).toBeVisible({ timeout: 12_000 }).catch(() => {});
    await this.page.waitForFunction(
      () => window.__GULFOS_E2E__?.getPhase() === 'locked',
      undefined,
      { timeout: 25_000 },
    );
  }

  async waitForLockScreen() {
    await expect(this.page.locator('[data-testid="gulfos-lock-screen"]')).toBeVisible({ timeout: 10_000 });
  }

  async unlock() {
    const locked = await this.page.evaluate(() => window.__GULFOS_E2E__?.isLocked());
    if (!locked) {
      await expect(this.page.locator('[data-testid="gulfos-home-screen"]')).toBeVisible({ timeout: 5_000 });
      return;
    }

    const lock = this.page.locator('[data-testid="gulfos-lock-screen"]');
    const box = await lock.boundingBox({ timeout: 3_000 }).catch(() => null);
    if (box) {
      const cx = box.x + box.width / 2;
      await this.page.mouse.move(cx, box.y + box.height - 30);
      await this.page.mouse.down();
      await this.page.mouse.move(cx, box.y + 40, { steps: 12 });
      await this.page.mouse.up();
      await this.page.waitForTimeout(400);
    }

    const stillLocked = await this.page.evaluate(() => window.__GULFOS_E2E__?.isLocked());
    if (stillLocked) {
      await this.page.evaluate(() => window.__GULFOS_E2E__?.unlock());
      await this.page.waitForTimeout(300);
    }

    await expect(this.page.locator('[data-testid="gulfos-home-screen"]')).toBeVisible({ timeout: 8_000 });
  }

  async ensureHome() {
    const onHome = await this.page.locator('[data-testid="gulfos-home-screen"]').isVisible({ timeout: 2_000 }).catch(() => false);
    if (!onHome) {
      const locked = await this.page.getByText('Swipe up to unlock').isVisible({ timeout: 1_000 }).catch(() => false);
      if (locked) await this.unlock();
      else await this.page.evaluate(() => window.__GULFOS_E2E__?.unlock());
    }
  }

  async swipeOnFrame(direction: 'up' | 'down' | 'left' | 'right', opts?: { fromTop?: boolean }) {
    const box = await this.frame.boundingBox();
    if (!box) throw new Error('Phone frame not found');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const margin = 60;

    let x1 = cx, y1 = cy, x2 = cx, y2 = cy;
    switch (direction) {
      case 'up':
        y1 = box.y + box.height - margin;
        y2 = box.y + margin;
        break;
      case 'down':
        y1 = opts?.fromTop ? box.y + 30 : box.y + margin;
        y2 = box.y + box.height * 0.5;
        break;
      case 'left':
        x1 = box.x + box.width - margin;
        x2 = box.x + margin;
        break;
      case 'right':
        x1 = box.x + margin;
        x2 = box.x + box.width - margin;
        break;
    }

    await this.page.mouse.move(x1, y1);
    await this.page.mouse.down();
    await this.page.mouse.move(x2, y2, { steps: 10 });
    await this.page.mouse.up();
    await this.page.waitForTimeout(500);
  }

  async longPressFrame(ms = 600) {
    const box = await this.frame.boundingBox();
    if (!box) throw new Error('Phone frame not found');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await this.page.mouse.move(cx, cy);
    await this.page.mouse.down();
    await this.page.waitForTimeout(ms);
    await this.page.mouse.up();
    await this.page.waitForTimeout(400);
  }

  async closeAllPanels() {
    await this.page.evaluate(() => window.__GULFOS_E2E__?.closeAllPanels());
    await this.page.waitForTimeout(250);
  }

  async launchFromDock(name: string) {
    await this.ensureHome();
    await this.closeAllPanels();
    await this.page.locator('[data-testid="gulfos-dock"]').getByRole('button', { name, exact: true }).click({ timeout: 10_000 });
    await this.page.waitForTimeout(500);
  }

  async launchFromHome(name: string) {
    await this.ensureHome();
    await this.closeAllPanels();
    const icon = this.page.locator('[data-testid="gulfos-home-screen"]').getByRole('button', { name, exact: true }).first();
    if (await icon.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await icon.click();
      await this.page.waitForTimeout(600);
      return true;
    }
    return false;
  }

  async launchAppByBundleId(bundleId: string, name: string) {
    await this.ensureHome();
    await this.closeAllPanels();
    await this.page.evaluate(
      ({ id, n }) => window.__GULFOS_E2E__?.launchApp(id, n),
      { id: bundleId, n: name }
    );
    await this.page.waitForTimeout(500);
  }

  async closeAllApps() {
    if (this.page.isClosed()) return;
    await this.page.evaluate(() => window.__GULFOS_E2E__?.closeAllApps()).catch(() => {});
    await this.page.waitForTimeout(150);
  }

  async closeApp() {
    if (this.page.isClosed()) return;
    await this.closeAllApps();
    await this.page.waitForTimeout(250);
  }

  async openControlCenter() {
    await this.page.evaluate(() => window.__GULFOS_E2E__?.openControlCenter());
    await this.page.waitForTimeout(400);
  }

  async openNotificationCenter() {
    await this.page.evaluate(() => window.__GULFOS_E2E__?.openNotificationCenter());
    await this.page.waitForTimeout(400);
  }

  async openSearch() {
    await this.page.evaluate(() => window.__GULFOS_E2E__?.openSearch());
    await this.page.waitForTimeout(400);
  }

  async openAppLibrary() {
    await this.page.evaluate(() => window.__GULFOS_E2E__?.openAppLibrary());
    await this.page.waitForTimeout(400);
  }

  async seedAuth() {
    await this.page.evaluate((creds) => {
      const auth = {
        state: {
          user: {
            id: 'demo-user',
            username: creds.username,
            email: creds.email,
            displayName: 'مستخدم تجريبي',
            role: 'user',
          },
          tokens: null as unknown,
          isAuthenticated: false,
          isLoading: false,
        },
        version: 0,
      };
      localStorage.setItem('bananaos-auth', JSON.stringify(auth));
    }, { username: DEMO_CREDENTIALS.username, email: DEMO_CREDENTIALS.email });
  }

  async loginViaStore() {
    const email = this.page.locator('input[type="email"]');
    if (await email.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await email.fill(DEMO_CREDENTIALS.email);
      await this.page.locator('input[type="password"]').fill(DEMO_CREDENTIALS.password);
      await this.page.getByRole('button', { name: /sign in/i }).click();
      await this.page.waitForTimeout(1_500);
      return true;
    }
    return false;
  }

  async logout() {
    await this.page.evaluate(() => {
      localStorage.removeItem('bananaos-auth');
      localStorage.removeItem('gulfos-auth');
      localStorage.removeItem('gulfos_tokens');
    });
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.frame.waitFor({ state: 'visible', timeout: 30_000 });
    await this.waitForLockScreen().catch(() => {});
    await this.unlock().catch(() => {});
  }

  async restartPhone() {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.frame.waitFor({ state: 'visible', timeout: 30_000 });
    await this.waitForSplash().catch(() => {});
    await this.waitForBoot();
    await this.waitForLockScreen();
  }

  async shutdown() {
    await this.closeAllApps();
    await this.page.evaluate(() => window.__GULFOS_E2E__?.shutdown());
    await this.pause(2500);
  }

  async browseApp(bundleId: string, name: string, dwellMs = 3500) {
    await this.ensureHome();
    await this.closeAllPanels();
    await this.launchAppByBundleId(bundleId, name);
    await this.pause(dwellMs);
    await this.closeApp();
  }

  async isAppOpen(title: string) {
    return this.page.getByRole('heading', { name: title }).isVisible({ timeout: 3_000 }).catch(() => false)
      || this.page.locator('h1').filter({ hasText: title }).isVisible({ timeout: 1_000 }).catch(() => false);
  }

  async hasVisibleContent(minLength = 10) {
    const text = await this.frame.innerText().catch(() => '');
    return text.replace(/\s+/g, ' ').trim().length > minLength;
  }
}
