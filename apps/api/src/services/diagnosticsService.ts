import { Types } from 'mongoose';
import { DiagnosticsSnapshot } from '../database/models/DiagnosticsSnapshot';
import { getHardwareProfile } from './hardwareService';
import { getRamUsage } from './ramService';
import { buildStorageBreakdown } from './deviceStorageService';
import { getStorageWear } from './storageWearService';
import { getNetwork } from './networkService';
import { getJobStats } from './jobService';
import { emitToUser } from './socketService';

const SERVICE_NAMES = [
  'location', 'network', 'deviceState', 'jobs', 'permissions',
  'notifications', 'eventBus', 'storage', 'hardware',
];

function formatReport(snapshot: InstanceType<typeof DiagnosticsSnapshot>) {
  return {
    memory: snapshot.memory,
    cpu: snapshot.cpu,
    gpu: snapshot.gpu,
    fps: snapshot.fps,
    storage: snapshot.storage,
    network: snapshot.network,
    battery: snapshot.battery,
    temperature: snapshot.temperature,
    backgroundJobs: snapshot.backgroundJobs,
    socketConnected: snapshot.socketConnected,
    serviceHealth: snapshot.serviceHealth,
    errors: snapshot.diagnosticErrors,
    warnings: snapshot.warnings,
    collectedAt: snapshot.createdAt.toISOString(),
  };
}

export async function collectDiagnostics(userId: string, socketConnected = true) {
  const warnings: string[] = [];
  const diagnosticErrors: string[] = [];

  const [hardware, ram, storage, wear, network, jobStats] = await Promise.all([
    getHardwareProfile(userId).catch(() => null),
    getRamUsage(userId).catch(() => null),
    buildStorageBreakdown(userId).catch(() => null),
    getStorageWear(userId).catch(() => null),
    getNetwork(userId).catch(() => null),
    getJobStats(userId).catch(() => ({ running: 0, queued: 0, failed: 0 })),
  ]);

  if (ram?.memoryPressure) warnings.push('Memory pressure detected');
  if (hardware?.lowStorageMode) warnings.push('Low storage mode active');
  if (hardware?.emergencyMode) diagnosticErrors.push('Emergency storage mode');
  if (!network?.internetConnected) warnings.push('No internet connection');
  if (jobStats.failed > 0) warnings.push(`${jobStats.failed} failed background jobs`);

  const serviceHealth: Record<string, 'healthy' | 'degraded' | 'down'> = {};
  for (const name of SERVICE_NAMES) {
    serviceHealth[name] = diagnosticErrors.length > 0 ? 'degraded' : warnings.length > 0 ? 'degraded' : 'healthy';
  }

  const snapshot = await DiagnosticsSnapshot.create({
    userId: new Types.ObjectId(userId),
    memory: {
      used: ram?.used ?? 0,
      total: ram?.total ?? 0,
      pressure: ram?.memoryPressure ?? false,
    },
    cpu: { load: ram ? ram.pressure : 0, model: hardware?.cpu ?? '' },
    gpu: { load: 0.1, model: hardware?.gpu ?? '' },
    fps: 60,
    storage: {
      used: storage?.used ?? 0,
      total: storage?.total ?? 0,
      health: wear?.healthPercent ?? 100,
    },
    network: {
      latency: network?.latencyMs ?? 0,
      bandwidth: network?.bandwidthMbps ?? 0,
      connected: network?.internetConnected ?? false,
    },
    battery: {
      level: hardware?.batteryLevel ?? 100,
      health: hardware?.batteryHealth ?? 100,
      charging: false,
    },
    temperature: hardware?.temperature ?? 32,
    backgroundJobs: jobStats,
    socketConnected,
    serviceHealth,
    queryCacheHits: 0,
    diagnosticErrors,
    warnings,
  });

  const report = formatReport(snapshot);

  emitToUser(userId, 'diagnostics:update', report);
  emitToUser(userId, 'service:health', { services: serviceHealth, timestamp: report.collectedAt });

  return report;
}

export async function getLatestDiagnostics(userId: string) {
  const snapshot = await DiagnosticsSnapshot.findOne({ userId, deletedAt: null })
    .sort({ createdAt: -1 });
  if (!snapshot) return collectDiagnostics(userId);
  return formatReport(snapshot);
}

export async function getDiagnosticsHistory(userId: string, limit = 20) {
  const snapshots = await DiagnosticsSnapshot.find({ userId, deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(limit);
  return snapshots.map((s) => ({
    collectedAt: s.createdAt.toISOString(),
    errors: s.diagnosticErrors.length,
    warnings: s.warnings.length,
    memoryPressure: s.memory.pressure,
    batteryLevel: s.battery.level,
  }));
}
