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

  registerBackgroundTask('location-refresh', 30 * 1000, async () => {
    const { refreshAllLocations } = await import('./locationService');
    await refreshAllLocations();
  });

  registerBackgroundTask('network-refresh', 15 * 1000, async () => {
    const { refreshAllNetworks } = await import('./networkService');
    await refreshAllNetworks();
  });

  registerBackgroundTask('device-state-refresh', 20 * 1000, async () => {
    const { refreshAllDeviceStates } = await import('./deviceStateService');
    await refreshAllDeviceStates();
  });

  registerBackgroundTask('storage-refresh', 5 * 60 * 1000, async () => {
    const { refreshAllStorage } = await import('./deviceStorageService');
    await refreshAllStorage();
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
