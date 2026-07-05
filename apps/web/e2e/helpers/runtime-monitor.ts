import type { Page, Request, Response } from '@playwright/test';

export interface RuntimeError {
  type: 'console' | 'pageerror' | 'network';
  message: string;
  url?: string;
  status?: number;
  timestamp: string;
}

export interface PerformanceSample {
  timestamp: string;
  label: string;
  durationMs: number;
  memoryMb?: number;
}

export class RuntimeMonitor {
  private errors: RuntimeError[] = [];
  private perf: PerformanceSample[] = [];
  private attached = false;

  attach(page: Page) {
    if (this.attached) return;
    this.attached = true;

    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (/favicon|devtools|extension/i.test(text)) return;
      this.errors.push({
        type: 'console',
        message: text,
        timestamp: new Date().toISOString(),
      });
    });

    page.on('pageerror', (err) => {
      this.errors.push({
        type: 'pageerror',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    });

    page.on('response', (res: Response) => {
      const status = res.status();
      if (status < 400) return;
      const url = res.url();
      if (/favicon|\.map$|sockjs|hot-update/i.test(url)) return;
      this.errors.push({
        type: 'network',
        message: `HTTP ${status}`,
        url,
        status,
        timestamp: new Date().toISOString(),
      });
    });
  }

  async samplePerformance(page: Page, label: string) {
    const sample = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
      return {
        durationMs: nav ? Math.round(nav.loadEventEnd - nav.startTime) : 0,
        memoryMb: mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : undefined,
      };
    }).catch(() => ({ durationMs: 0, memoryMb: undefined as number | undefined }));

    this.perf.push({
      timestamp: new Date().toISOString(),
      label,
      durationMs: sample.durationMs,
      memoryMb: sample.memoryMb ?? undefined,
    });
  }

  getErrors() {
    return [...this.errors];
  }

  getPerformance() {
    return [...this.perf];
  }

  hasCriticalErrors() {
    return this.errors.some(
      (e) =>
        e.type === 'pageerror' ||
        (e.type === 'network' && e.status && e.status >= 500) ||
        (e.type === 'console' && /uncaught|failed to load mdt/i.test(e.message)),
    );
  }
}
