/**
 * Single background scheduler for all GULFOS system tasks.
 * Replaces individual setInterval simulators.
 */

type ScheduledTask = {
  name: string;
  intervalMs: number;
  lastRun: number;
  run: () => Promise<void>;
};

const tasks: ScheduledTask[] = [];
let masterInterval: ReturnType<typeof setInterval> | null = null;
let started = false;

const TICK_MS = 10_000;

export function registerBackgroundTask(
  name: string,
  intervalMs: number,
  run: () => Promise<void>
): void {
  tasks.push({ name, intervalMs, lastRun: 0, run });
}

async function runDueTasks(): Promise<void> {
  const now = Date.now();
  for (const task of tasks) {
    if (now - task.lastRun >= task.intervalMs) {
      task.lastRun = now;
      try {
        await task.run();
      } catch (err) {
        console.error(`[BackgroundManager] Task "${task.name}" failed:`, err);
      }
    }
  }
}

export function startBackgroundServiceManager(): void {
  if (started) return;
  started = true;

  registerBackgroundTask('cache-growth', 60 * 60 * 1000, async () => {
    const { growCachesForAll } = await import('./cacheGrowthService');
    await growCachesForAll();
  });

  registerBackgroundTask('trash-cleanup', 24 * 60 * 60 * 1000, async () => {
    const { purgeExpiredTrash } = await import('./mediaStorageService');
    await purgeExpiredTrash();
  });

  registerBackgroundTask('hardware-sim', 5 * 60 * 1000, async () => {
    const { refreshAllHardware } = await import('./hardwareService');
    await refreshAllHardware();
  });

  registerBackgroundTask('communication-tick', 5 * 1000, async () => {
    const { communicationTick } = await import('./communicationService');
    await communicationTick();
  });

  registerBackgroundTask('communication-sync', 30 * 1000, async () => {
    const { OfflineMessageQueue } = await import('../database/models/OfflineMessageQueue');
    const { syncOfflineQueue } = await import('./syncService');
    const pending = await OfflineMessageQueue.find({ state: 'pending', deletedAt: null }).limit(20);
    for (const entry of pending) {
      await syncOfflineQueue(entry.userId.toString());
    }
  });

  registerBackgroundTask('world-engine-tick', 15 * 1000, async () => {
    const { tickAllWorlds } = await import('./worldEngineService');
    await tickAllWorlds();
  });

  registerBackgroundTask('device-state-refresh', 20 * 1000, async () => {
    const { refreshAllDeviceStates } = await import('./deviceStateService');
    await refreshAllDeviceStates();
  });

  registerBackgroundTask('storage-refresh', 5 * 60 * 1000, async () => {
    const { refreshAllStorage } = await import('./deviceStorageService');
    await refreshAllStorage();
  });

  registerBackgroundTask('device-ecosystem-tick', 60 * 1000, async () => {
    const { deviceEcosystemTick } = await import('./deviceEcosystemService');
    await deviceEcosystemTick();
  });

  registerBackgroundTask('phone-os-tick', 30 * 1000, async () => {
    const { phoneOsTickAll } = await import('./phoneOsService');
    await phoneOsTickAll();
  });

  registerBackgroundTask('live-activity-expiry', 60 * 1000, async () => {
    const { expireStaleActivities } = await import('./liveActivityService');
    await expireStaleActivities();
  });

  registerBackgroundTask('clock-alarms', 60 * 1000, async () => {
    const { ClockAlarm } = await import('../database/models/ClockAlarm');
    const { scheduleAlarmNotifications } = await import('./clockService');
    const alarms = await ClockAlarm.find({ enabled: true, deletedAt: null }).distinct('userId');
    for (const userId of alarms) {
      await scheduleAlarmNotifications(userId.toString());
    }
  });

  registerBackgroundTask('job-processor', 5 * 1000, async () => {
    const { processJobQueue } = await import('./jobService');
    await processJobQueue();
  });

  registerBackgroundTask('notification-processor', 10 * 1000, async () => {
    const { processPendingNotifications } = await import('./notificationBrokerService');
    await processPendingNotifications();
  });

  registerBackgroundTask('telephony-cleanup', 60 * 1000, async () => {
    const { cleanupStaleCalls } = await import('./callEngineService');
    await cleanupStaleCalls();
  });

  registerBackgroundTask('sim-status-refresh', 30 * 1000, async () => {
    const { refreshAllSimStatus } = await import('./simService');
    await refreshAllSimStatus();
  });

  registerBackgroundTask('prediction-refresh', 15 * 60 * 1000, async () => {
    const { User } = await import('../database/models/User');
    const users = await User.find({}).limit(50).select('_id');
    for (const u of users) {
      try {
        const { runBackgroundOptimization } = await import('./intelligenceService');
        await runBackgroundOptimization(u._id.toString());
      } catch { /* per-user */ }
    }
  });

  registerBackgroundTask('search-index-refresh', 30 * 60 * 1000, async () => {
    const { User } = await import('../database/models/User');
    const users = await User.find({}).limit(50).select('_id');
    for (const u of users) {
      try {
        const { refreshSearchIndex } = await import('./intelligenceService');
        await refreshSearchIndex(u._id.toString());
      } catch { /* per-user */ }
    }
  });

  registerBackgroundTask('automation-scheduler', 60 * 1000, async () => {
    const { Automation } = await import('../database/models/Automation');
    const active = await Automation.find({ status: 'active', deletedAt: null }).limit(20);
    for (const auto of active) {
      const timeTrigger = auto.triggers.find((t) => t.type === 'time' || t.type === 'date');
      if (timeTrigger) {
        const { runAutomation } = await import('./automationService');
        try {
          await runAutomation(auto.userId.toString(), auto.automationId, auto.userId.toString());
        } catch { /* scheduled run */ }
      }
    }
  });

  registerBackgroundTask('assistant-cleanup', 60 * 60 * 1000, async () => {
    const { VoiceSession } = await import('../database/models/Intelligence');
    const stale = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await VoiceSession.updateMany({ status: { $ne: 'ended' }, startedAt: { $lt: stale } }, { status: 'ended', endedAt: new Date() });
  });

  registerBackgroundTask('cloud-backup-monitor', 6 * 60 * 60 * 1000, async () => {
    const { CloudBackup } = await import('../database/models/Phase55');
    const stale = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await CloudBackup.deleteMany({ state: 'completed', completedAt: { $lt: stale } });
  });

  registerBackgroundTask('security-monitor', 30 * 60 * 1000, async () => {
    const { User } = await import('../database/models/User');
    const users = await User.find({}).limit(20).select('_id');
    for (const u of users) {
      try {
        const { getSecurityDashboard } = await import('./phase55Service');
        const dash = await getSecurityDashboard(u._id.toString());
        if (dash.securityScore < 50) {
          const { logSecurityEvent } = await import('./phase55Service');
          await logSecurityEvent(u._id.toString(), 'score_low', 'Security score below threshold', 'high');
        }
      } catch { /* per-user */ }
    }
  });

  registerBackgroundTask('continuity-cleanup', 15 * 60 * 1000, async () => {
    const { ContinuitySession, ClipboardSession } = await import('../database/models/Personalization');
    const now = new Date();
    await ContinuitySession.updateMany({ expiresAt: { $lt: now }, status: 'active' }, { status: 'expired' });
    await ClipboardSession.deleteMany({ expiresAt: { $lt: now } });
  });

  registerBackgroundTask('idempotency-cleanup', 60 * 60 * 1000, async () => {
    const { purgeExpiredIdempotencyRecords } = await import('./idempotencyService');
    await purgeExpiredIdempotencyRecords();
  });

  registerBackgroundTask('api-heartbeat', 60 * 1000, async () => {
    const { recordServiceHeartbeat } = await import('./serviceRegistryService');
    recordServiceHeartbeat({ serviceId: 'api', status: 'healthy', version: '1.0.0' });
  });

  registerBackgroundTask('economy-tick', 60 * 60 * 1000, async () => {
    const { tickEconomy } = await import('./economyEngineService');
    await tickEconomy('system');
    const { tickExchange } = await import('./exchangeService');
    await tickExchange();
  });

  masterInterval = setInterval(() => {
    void runDueTasks();
  }, TICK_MS);

  void (async () => {
    const { recoverCrashedJobs } = await import('./jobService');
    const recovered = await recoverCrashedJobs();
    if (recovered > 0) console.log(`[BackgroundManager] Recovered ${recovered} crashed jobs`);
  })();

  console.log(`[BackgroundManager] Started with ${tasks.length} tasks`);
}

export function stopBackgroundServiceManager(): void {
  if (masterInterval) {
    clearInterval(masterInterval);
    masterInterval = null;
  }
  started = false;
}

export function getRegisteredTasks(): string[] {
  return tasks.map((t) => t.name);
}
