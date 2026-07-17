import fs from 'fs';
import path from 'path';
import type { AppStatus } from './app-catalog';

export interface StepResult {
  step: number;
  name: string;
  status: 'pass' | 'fail' | 'partial' | 'skip';
  notes?: string;
  durationMs?: number;
}

export interface AppResult {
  bundleId: string;
  name: string;
  status: AppStatus;
  notes?: string;
  launched: boolean;
  hasContent: boolean;
}

export class DemoReport {
  private steps: StepResult[] = [];
  private apps = new Map<string, AppResult>();
  private errors: string[] = [];
  private startedAt = Date.now();

  recordStep(step: number, name: string, status: StepResult['status'], notes?: string) {
    const existing = this.steps.findIndex((s) => s.step === step);
    const entry = { step, name, status, notes };
    if (existing >= 0) this.steps[existing] = entry;
    else this.steps.push(entry);
    if (status === 'fail') this.errors.push(`Step ${step} (${name}): ${notes ?? 'failed'}`);
  }

  recordApp(bundleId: string, name: string, status: AppStatus, notes?: string, launched = false, hasContent = false) {
    this.apps.set(bundleId, { bundleId, name, status, notes, launched, hasContent });
  }

  recordError(message: string) {
    this.errors.push(message);
  }

  getSummary() {
    const apps = [...this.apps.values()];
    return {
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - this.startedAt,
      steps: {
        total: this.steps.length,
        passed: this.steps.filter((s) => s.status === 'pass').length,
        partial: this.steps.filter((s) => s.status === 'partial').length,
        failed: this.steps.filter((s) => s.status === 'fail').length,
        skipped: this.steps.filter((s) => s.status === 'skip').length,
      },
      apps: {
        total: apps.length,
        full: apps.filter((a) => a.status === 'full').length,
        partial: apps.filter((a) => a.status === 'partial').length,
        failed: apps.filter((a) => a.status === 'failed').length,
        skipped: apps.filter((a) => a.status === 'skipped').length,
      },
      stepsDetail: this.steps,
      appsDetail: apps,
      errors: this.errors,
    };
  }

  write(outputDir: string) {
    fs.mkdirSync(outputDir, { recursive: true });
    const summary = this.getSummary();

    fs.writeFileSync(path.join(outputDir, 'demo-report.json'), JSON.stringify(summary, null, 2));

    const md = this.toMarkdown(summary);
    fs.writeFileSync(path.join(outputDir, 'demo-report.md'), md);

    return summary;
  }

  private toMarkdown(summary: ReturnType<DemoReport['getSummary']>) {
    const lines: string[] = [
      '# GULFOS Full Demo Report',
      '',
      `**Generated:** ${summary.generatedAt}`,
      `**Duration:** ${Math.round(summary.durationMs / 1000)}s`,
      '',
      '## Summary',
      '',
      `| Metric | Count |`,
      `|--------|-------|`,
      `| Demo steps passed | ${summary.steps.passed}/${summary.steps.total} |`,
      `| Demo steps partial | ${summary.steps.partial} |`,
      `| Demo steps failed | ${summary.steps.failed} |`,
      `| Apps fully working | ${summary.apps.full}/${summary.apps.total} |`,
      `| Apps partial | ${summary.apps.partial} |`,
      `| Apps failed | ${summary.apps.failed} |`,
      '',
      '## Demo Steps (38)',
      '',
      '| # | Step | Status | Notes |',
      '|---|------|--------|-------|',
    ];

    for (const s of summary.stepsDetail) {
      const icon = s.status === 'pass' ? '✅' : s.status === 'partial' ? '⚠️' : s.status === 'skip' ? '⏭️' : '❌';
      lines.push(`| ${s.step} | ${s.name} | ${icon} ${s.status} | ${s.notes ?? ''} |`);
    }

    lines.push('', '## Apps', '', '### Fully Working', '');
    const full = summary.appsDetail.filter((a) => a.status === 'full');
    const partial = summary.appsDetail.filter((a) => a.status === 'partial');
    const failed = summary.appsDetail.filter((a) => a.status === 'failed');
    const skipped = summary.appsDetail.filter((a) => a.status === 'skipped');

    if (full.length === 0) lines.push('_None_');
    else full.forEach((a) => lines.push(`- **${a.name}** (\`${a.bundleId}\`)${a.notes ? ` — ${a.notes}` : ''}`));

    lines.push('', '### Partially Working', '');
    if (partial.length === 0) lines.push('_None_');
    else partial.forEach((a) => lines.push(`- **${a.name}** (\`${a.bundleId}\`) — ${a.notes ?? 'UI loads, limited functionality'}`));

    lines.push('', '### Not Working / Incomplete', '');
    if (failed.length === 0) lines.push('_None_');
    else failed.forEach((a) => lines.push(`- **${a.name}** (\`${a.bundleId}\`) — ${a.notes ?? 'Failed to launch'}`));

    if (skipped.length > 0) {
      lines.push('', '### Skipped', '');
      skipped.forEach((a) => lines.push(`- **${a.name}** (\`${a.bundleId}\`) — ${a.notes ?? ''}`));
    }

    if (summary.errors.length > 0) {
      lines.push('', '## Errors', '');
      summary.errors.forEach((e) => lines.push(`- ${e}`));
    }

    lines.push(
      '',
      '## ملخص بالعربية',
      '',
      `| المقياس | العدد |`,
      `|---------|-------|`,
      `| خطوات الاستعراض الناجحة | ${summary.steps.passed}/${summary.steps.total} |`,
      `| تطبيقات تعمل بالكامل | ${summary.apps.full}/${summary.apps.total} |`,
      `| تطبيقات جزئية | ${summary.apps.partial} |`,
      `| تطبيقات غير مكتملة | ${summary.apps.failed} |`,
      '',
      '### التطبيقات التي تعمل بالكامل',
      '',
    );
    if (full.length === 0) lines.push('_لا يوجد_');
    else full.forEach((a) => lines.push(`- **${a.name}**`));

    lines.push('', '### التطبيقات التي تعمل جزئيًا', '');
    if (partial.length === 0) lines.push('_لا يوجد_');
    else partial.forEach((a) => lines.push(`- **${a.name}** — ${a.notes ?? 'واجهة محدودة'}`));

    lines.push('', '### التطبيقات غير المكتملة', '');
    if (failed.length === 0) lines.push('_لا يوجد_');
    else failed.forEach((a) => lines.push(`- **${a.name}** — ${a.notes ?? 'فشل التشغيل'}`));

    return lines.join('\n');
  }
}
