import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const outputDir = path.join(__dirname, 'demo-output');

/** 4K cinematic showcase — native browser frame rate (no interpolation). */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'gulfos-official-showcase.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  timeout: 7_200_000,
  expect: { timeout: 12_000 },
  use: {
    actionTimeout: 12_000,
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'off',
    screenshot: 'off',
    video: {
      mode: 'on',
      size: { width: 3840, height: 2160 },
    },
    viewport: { width: 3840, height: 2160 },
    deviceScaleFactor: 1,
    launchOptions: {
      slowMo: process.env.DEMO_SLOW_MO ? Number(process.env.DEMO_SLOW_MO) : 120,
      args: [
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    },
  },
  projects: [
    {
      name: 'chromium-4k',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 3840, height: 2160 },
      },
    },
  ],
  outputDir: path.join(outputDir, 'showcase-results'),
});
