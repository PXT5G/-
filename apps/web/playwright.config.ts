import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const outputDir = path.join(__dirname, 'demo-output');

export default defineConfig({
  testDir: './e2e',
  testMatch: /gulfos-(full-demo|apps-audit|preflight)\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(outputDir, 'html-report'), open: 'never' }],
    ['json', { outputFile: path.join(outputDir, 'results.json') }],
  ],
  timeout: 600_000,
  expect: { timeout: 8_000 },
  use: {
    actionTimeout: 8_000,
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: {
      mode: 'on',
      size: { width: 1280, height: 900 },
    },
    viewport: { width: 1280, height: 900 },
    launchOptions: {
      slowMo: process.env.DEMO_SLOW_MO ? Number(process.env.DEMO_SLOW_MO) : 60,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
  outputDir: path.join(outputDir, 'test-results'),
});
