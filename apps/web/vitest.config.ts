import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Unit tests only — Playwright owns everything under e2e/
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
