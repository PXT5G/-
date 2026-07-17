import fs from 'fs';
import path from 'path';
import type { AppResult } from './demo-report';
import type { RuntimeError, PerformanceSample } from './runtime-monitor';

export interface VerificationBundle {
  generatedAt: string;
  durationMs: number;
  video?: {
    rawPath?: string;
    exportPath?: string;
    resolution?: string;
    fps?: number;
    codec?: string;
    bitrateKbps?: number;
  };
  applicationAudit: {
    total: number;
    full: number;
    partial: number;
    failed: number;
    apps: AppResult[];
  };
  runtimeAudit: {
    totalErrors: number;
    consoleErrors: number;
    pageErrors: number;
    networkErrors: number;
    errors: RuntimeError[];
    passed: boolean;
  };
  performance: {
    samples: PerformanceSample[];
    avgLoadMs: number;
    peakMemoryMb: number;
  };
  apiVerification: {
    healthOk: boolean;
    authOk: boolean;
    govAppsInitialized: boolean;
    endpointsChecked: number;
    endpointsFailed: number;
    details: { endpoint: string; status: number; ok: boolean }[];
  };
  finalVerification: {
    allAppsLaunch: boolean;
    noRuntimeErrors: boolean;
    allAnimationsOk: boolean;
    allApiOk: boolean;
    systemFeaturesOk: boolean;
    readyForShowcase: boolean;
  };
}

export function writeVerificationReports(outputDir: string, bundle: VerificationBundle) {
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, 'verification-bundle.json'),
    JSON.stringify(bundle, null, 2),
  );

  fs.writeFileSync(path.join(outputDir, 'application-audit.md'), renderAppAudit(bundle));
  fs.writeFileSync(path.join(outputDir, 'runtime-audit.md'), renderRuntimeAudit(bundle));
  fs.writeFileSync(path.join(outputDir, 'performance-report.md'), renderPerformance(bundle));
  fs.writeFileSync(path.join(outputDir, 'final-verification-report.md'), renderFinal(bundle));

  return bundle;
}

function renderAppAudit(b: VerificationBundle) {
  const { applicationAudit: a } = b;
  const lines = [
    '# GULFOS Application Audit',
    '',
    `**Generated:** ${b.generatedAt}`,
    '',
    '## Summary',
    '',
    `| Status | Count |`,
    `|--------|-------|`,
    `| Fully working | ${a.full}/${a.total} |`,
    `| Partial | ${a.partial} |`,
    `| Failed | ${a.failed} |`,
    '',
    '## Applications',
    '',
  ];

  for (const app of a.apps) {
    const icon = app.status === 'full' ? '✅' : app.status === 'partial' ? '⚠️' : '❌';
    lines.push(`- ${icon} **${app.name}** (\`${app.bundleId}\`) — ${app.status}${app.notes ? `: ${app.notes}` : ''}`);
  }

  return lines.join('\n');
}

function renderRuntimeAudit(b: VerificationBundle) {
  const { runtimeAudit: r } = b;
  const lines = [
    '# GULFOS Runtime Error Report',
    '',
    `**Generated:** ${b.generatedAt}`,
    `**Status:** ${r.passed ? '✅ PASSED' : '❌ FAILED'}`,
    '',
    '## Summary',
    '',
    `| Type | Count |`,
    `|------|-------|`,
    `| Console errors | ${r.consoleErrors} |`,
    `| Page errors | ${r.pageErrors} |`,
    `| Network errors (4xx/5xx) | ${r.networkErrors} |`,
    `| **Total** | **${r.totalErrors}** |`,
    '',
  ];

  if (r.errors.length === 0) {
    lines.push('No runtime errors detected.');
  } else {
    lines.push('## Errors', '');
    for (const e of r.errors.slice(0, 100)) {
      lines.push(`- **[${e.type}]** ${e.message}${e.url ? ` — \`${e.url}\`` : ''}`);
    }
    if (r.errors.length > 100) lines.push(`\n_...and ${r.errors.length - 100} more_`);
  }

  return lines.join('\n');
}

function renderPerformance(b: VerificationBundle) {
  const { performance: p } = b;
  const lines = [
    '# GULFOS Performance Report',
    '',
    `**Generated:** ${b.generatedAt}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Average page load | ${p.avgLoadMs}ms |`,
    `| Peak JS heap | ${p.peakMemoryMb} MB |`,
    `| Samples collected | ${p.samples.length} |`,
    '',
  ];

  if (p.samples.length > 0) {
    lines.push('## Samples', '', '| Label | Load (ms) | Memory (MB) |', '|-------|-----------|-------------|');
    for (const s of p.samples) {
      lines.push(`| ${s.label} | ${s.durationMs} | ${s.memoryMb ?? '—'} |`);
    }
  }

  if (b.video) {
    lines.push(
      '',
      '## Showcase Video',
      '',
      `| Property | Value |`,
      `|----------|-------|`,
      `| Resolution | ${b.video.resolution ?? '—'} |`,
      `| FPS | ${b.video.fps ?? 'native'} |`,
      `| Codec | ${b.video.codec ?? '—'} |`,
      `| Bitrate | ${b.video.bitrateKbps ? `${b.video.bitrateKbps} kbps` : '—'} |`,
    );
  }

  return lines.join('\n');
}

function renderFinal(b: VerificationBundle) {
  const f = b.finalVerification;
  const lines = [
    '# GULFOS Final Verification Report',
    '',
    `**Generated:** ${b.generatedAt}`,
    `**Duration:** ${Math.round(b.durationMs / 1000)}s`,
    '',
    '## Official Showcase Readiness',
    '',
    `| Check | Status |`,
    `|-------|--------|`,
    `| All applications launch | ${f.allAppsLaunch ? '✅' : '❌'} |`,
    `| No runtime errors | ${f.noRuntimeErrors ? '✅' : '❌'} |`,
    `| Animations functioning | ${f.allAnimationsOk ? '✅' : '❌'} |`,
    `| API requests succeed | ${f.allApiOk ? '✅' : '❌'} |`,
    `| System features work | ${f.systemFeaturesOk ? '✅' : '❌'} |`,
    `| **Ready for showcase** | **${f.readyForShowcase ? '✅ YES' : '❌ NO'}** |`,
    '',
    '## Application Audit',
    '',
    `${b.applicationAudit.full}/${b.applicationAudit.total} applications fully working`,
    '',
    '## API Verification',
    '',
    `- Health endpoint: ${b.apiVerification.healthOk ? '✅' : '❌'}`,
    `- Authentication: ${b.apiVerification.authOk ? '✅' : '❌'}`,
    `- Government apps initialized: ${b.apiVerification.govAppsInitialized ? '✅' : '❌'}`,
    `- Endpoints checked: ${b.apiVerification.endpointsChecked} (${b.apiVerification.endpointsFailed} failed)`,
    '',
    '## Deliverables',
    '',
    b.video?.exportPath ? `- Final 4K video: \`${b.video.exportPath}\`` : '- Final 4K video: pending',
    b.video?.rawPath ? `- Raw recording: \`${b.video.rawPath}\`` : '- Raw recording: pending',
    '- Application audit: `application-audit.md`',
    '- Runtime audit: `runtime-audit.md`',
    '- Performance report: `performance-report.md`',
    '',
    '## Environment Notes',
    '',
    '- Playwright browser capture records at native ~25 FPS (no frame interpolation).',
    '- 4K export uses H.264 High Profile with CRF-based quality encoding.',
    '- True 60/120 FPS requires dedicated hardware screen capture.',
  ];

  return lines.join('\n');
}
