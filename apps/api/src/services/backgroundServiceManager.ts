/**
 * Single background scheduler for all BananaOS system tasks.
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
