import { collectDiagnostics, getDiagnosticsHistory } from './diagnosticsService';
import { getPowerState } from './powerSystemService';
import { getExpandedStorageBreakdown } from './storageExpansionService';
import { getNetwork } from './networkService';
import { getRamUsage } from './ramService';
import { DeveloperLog } from '../database/models/DeveloperLog';
import { emitToUser } from './socketService';

export async function collectExtendedDiagnostics(userId: string) {
  const [base, power, storage, network, ram] = await Promise.all([
    collectDiagnostics(userId),
    getPowerState(userId),
    getExpandedStorageBreakdown(userId),
    getNetwork(userId).catch(() => null),
    getRamUsage(userId).catch(() => null),
  ]);

  const sensors = {
    accelerometer: { active: true, sampleRate: 100 },
    gyroscope: { active: true, sampleRate: 100 },
    ambientLight: { lux: 320 + Math.floor(Math.random() * 200) },
    proximity: { near: false },
  };

  const errorReports = await DeveloperLog.find({ userId, level: 'error' })
    .sort({ createdAt: -1 })
    .limit(10);

  const report = {
    ...base,
    power,
    storage: {
      ...base.storage,
      expanded: storage.expanded,
      trashItemCount: storage.trashItemCount,
    },
    network: {
      ...base.network,
      carrier: network?.carrier,
      signalStrength: network?.signalStrength,
      generation: network?.coverage,
    },
    sensors,
    ram: ram ? { used: ram.used, total: ram.total, pressure: ram.memoryPressure, apps: ram.apps.length } : base.memory,
    systemHealth: {
      score: Math.round((base.battery.health + (base.storage.health ?? 100) + (100 - (ram?.pressure ?? 0) * 100)) / 3),
      powerMode: power.powerMode,
      chargingCycles: power.chargingCycles,
    },
    errorReports: errorReports.map((e) => ({
      message: e.message,
      category: e.category,
      at: e.createdAt.toISOString(),
    })),
  };

  emitToUser(userId, 'device:diagnostics:extended', report);
  return report;
}

export { getDiagnosticsHistory, collectDiagnostics };
