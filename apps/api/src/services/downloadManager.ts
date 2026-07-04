import { StoreDownload } from '../database/models/StoreDownload';
import { App } from '../database/models/App';
import { InstalledApp } from '../database/models/InstalledApp';
import { getPackage, readPackageBytes } from './packageService';
import { executeInstall, executeUpdate } from './installService';
import { emitToUser } from './socketService';

const CHUNK_SIZE = 262_144; // 256 KB
const TICK_MS = 100;

interface ActiveJob {
  downloadId: string;
  userId: string;
  intervalId: ReturnType<typeof setInterval>;
  paused: boolean;
  cancelled: boolean;
  lastTick: number;
  lastBytes: number;
}

const activeJobs = new Map<string, ActiveJob>();
const userQueues = new Map<string, string[]>();

function emitProgress(
  userId: string,
  downloadId: string,
  bundleId: string,
  data: {
    progress: number;
    status: string;
    downloadedBytes: number;
    downloadSpeed?: number;
    etaSeconds?: number;
    installStep?: string;
  }
): void {
  emitToUser(userId, 'store:download:progress' as never, {
    downloadId,
    bundleId,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

async function processQueue(userId: string): Promise<void> {
  const queue = userQueues.get(userId) ?? [];
  const activeForUser = [...activeJobs.values()].filter((j) => j.userId === userId && !j.paused && !j.cancelled);
  if (activeForUser.length > 0 || queue.length === 0) return;

  const nextId = queue.shift()!;
  userQueues.set(userId, queue);
  await startDownloadJob(nextId, userId);
}

export async function enqueueDownload(downloadId: string, userId: string): Promise<void> {
  const queue = userQueues.get(userId) ?? [];
  queue.push(downloadId);
  userQueues.set(userId, queue);

  await StoreDownload.findByIdAndUpdate(downloadId, {
    queuePosition: queue.length,
    status: 'queued',
  });

  await processQueue(userId);
}

async function startDownloadJob(downloadId: string, userId: string): Promise<void> {
  const download = await StoreDownload.findById(downloadId);
  if (!download || download.status === 'cancelled') return;

  const pkg = await getPackage(download.bundleId, download.targetVersion);
  if (!pkg) {
    await failDownload(downloadId, userId, 'Package not found');
    return;
  }
  const totalSize = pkg.size;

  await StoreDownload.findByIdAndUpdate(downloadId, {
    status: 'downloading',
    size: totalSize,
    startedAt: new Date(),
    queuePosition: 0,
  });

  emitProgress(userId, downloadId, download.bundleId, {
    progress: 0,
    status: 'downloading',
    downloadedBytes: 0,
    downloadSpeed: 0,
    etaSeconds: Math.ceil(totalSize / 500_000),
  });

  let downloadedBytes = download.downloadedBytes ?? 0;
  const job: ActiveJob = {
    downloadId,
    userId,
    intervalId: setInterval(() => {}),
    paused: false,
    cancelled: false,
    lastTick: Date.now(),
    lastBytes: downloadedBytes,
  };

  const tick = async () => {
    if (job.paused || job.cancelled) return;

    const current = await StoreDownload.findById(downloadId);
    if (!current || current.status === 'cancelled' || current.status === 'paused') {
      job.paused = current?.status === 'paused';
      return;
    }

    const remaining = totalSize - downloadedBytes;
    const chunk = Math.min(CHUNK_SIZE, remaining);
    if (chunk <= 0) {
      clearInterval(job.intervalId);
      activeJobs.delete(downloadId);
      await finishDownload(downloadId, userId);
      return;
    }

    try {
      await readPackageBytes(download.bundleId, download.targetVersion, downloadedBytes, chunk);
      downloadedBytes += chunk;

      const now = Date.now();
      const elapsed = (now - job.lastTick) / 1000;
      const speed = elapsed > 0 ? (downloadedBytes - job.lastBytes) / elapsed : 0;
      job.lastTick = now;
      job.lastBytes = downloadedBytes;

      const progress = Math.min(100, Math.floor((downloadedBytes / totalSize) * 100));
      const etaSeconds = speed > 0 ? Math.ceil((totalSize - downloadedBytes) / speed) : 0;

      await StoreDownload.findByIdAndUpdate(downloadId, {
        downloadedBytes,
        progress,
        downloadSpeed: Math.floor(speed),
        etaSeconds,
      });

      emitProgress(userId, downloadId, download.bundleId, {
        progress,
        status: 'downloading',
        downloadedBytes,
        downloadSpeed: Math.floor(speed),
        etaSeconds,
      });
    } catch (err) {
      clearInterval(job.intervalId);
      activeJobs.delete(downloadId);
      await failDownload(downloadId, userId, err instanceof Error ? err.message : 'Download failed');
    }
  };

  job.intervalId = setInterval(tick, TICK_MS);
  activeJobs.set(downloadId, job);
}

async function finishDownload(downloadId: string, userId: string): Promise<void> {
  const download = await StoreDownload.findById(downloadId);
  if (!download) return;

  await StoreDownload.findByIdAndUpdate(downloadId, {
    status: 'installing',
    progress: 100,
    installStep: 'Starting installation',
  });

  emitProgress(userId, downloadId, download.bundleId, {
    progress: 100,
    status: 'installing',
    downloadedBytes: download.size,
    installStep: 'Starting installation',
  });

  try {
    if (download.type === 'update') {
      await executeUpdate(
        userId,
        download.bundleId,
        download.version,
        download.targetVersion,
        download.approvedPermissions
      );
    } else {
      await executeInstall(
        userId,
        download.bundleId,
        download.targetVersion,
        download.approvedPermissions,
        (p) => {
          emitProgress(userId, downloadId, download.bundleId, {
            progress: p.progress,
            status: 'installing',
            downloadedBytes: download.size,
            installStep: p.step,
          });
        }
      );
    }

    await StoreDownload.findByIdAndUpdate(downloadId, {
      status: 'completed',
      completedAt: new Date(),
      installStep: 'Complete',
    });

    emitToUser(userId, 'store:download:complete' as never, {
      downloadId,
      bundleId: download.bundleId,
      type: download.type,
      version: download.targetVersion,
      timestamp: new Date().toISOString(),
    });

    if (download.type === 'update') {
      emitToUser(userId, 'store:update:complete' as never, {
        bundleId: download.bundleId,
        version: download.targetVersion,
      });
    }
  } catch (err) {
    await failDownload(downloadId, userId, err instanceof Error ? err.message : 'Installation failed');
    return;
  }

  await processQueue(userId);
}

async function failDownload(downloadId: string, userId: string, error: string): Promise<void> {
  const download = await StoreDownload.findByIdAndUpdate(
    downloadId,
    { status: 'failed', error, completedAt: new Date() },
    { new: true }
  );

  if (download) {
    emitToUser(userId, 'store:download:progress' as never, {
      downloadId,
      bundleId: download.bundleId,
      progress: download.progress,
      status: 'failed',
      error,
      timestamp: new Date().toISOString(),
    });
  }

  await processQueue(userId);
}

export async function pauseDownload(downloadId: string, userId: string): Promise<void> {
  const job = activeJobs.get(downloadId);
  if (job) job.paused = true;

  const download = await StoreDownload.findOneAndUpdate(
    { _id: downloadId, userId },
    { status: 'paused', pausedAt: new Date() },
    { new: true }
  );
  if (!download) throw new Error('Download not found');

  emitToUser(userId, 'store:download:paused' as never, { downloadId, bundleId: download.bundleId });
}

export async function resumeDownload(downloadId: string, userId: string): Promise<void> {
  const download = await StoreDownload.findOne({ _id: downloadId, userId, status: 'paused' });
  if (!download) throw new Error('Download not found');

  const job = activeJobs.get(downloadId);
  if (job) {
    job.paused = false;
    await StoreDownload.findByIdAndUpdate(downloadId, { status: 'downloading', pausedAt: null });
  } else {
    await StoreDownload.findByIdAndUpdate(downloadId, { status: 'queued', pausedAt: null });
    await enqueueDownload(downloadId, userId);
  }

  emitToUser(userId, 'store:download:resumed' as never, { downloadId, bundleId: download.bundleId });
}

export async function cancelDownload(downloadId: string, userId: string): Promise<void> {
  const job = activeJobs.get(downloadId);
  if (job) {
    job.cancelled = true;
    clearInterval(job.intervalId);
    activeJobs.delete(downloadId);
  }

  const queue = userQueues.get(userId) ?? [];
  userQueues.set(userId, queue.filter((id) => id !== downloadId));

  await StoreDownload.findByIdAndUpdate(downloadId, {
    status: 'cancelled',
    completedAt: new Date(),
  });

  emitToUser(userId, 'store:download:cancelled' as never, {
    downloadId,
    timestamp: new Date().toISOString(),
  });

  await processQueue(userId);
}

export async function retryDownload(downloadId: string, userId: string): Promise<void> {
  const download = await StoreDownload.findOne({ _id: downloadId, userId, status: 'failed' });
  if (!download) throw new Error('Download not found');

  await StoreDownload.findByIdAndUpdate(downloadId, {
    status: 'queued',
    progress: 0,
    downloadedBytes: 0,
    error: null,
    completedAt: null,
  });

  await enqueueDownload(downloadId, userId);
}

export async function getDownloadQueue(userId: string) {
  const downloads = await StoreDownload.find({
    userId,
    status: { $in: ['queued', 'downloading', 'paused', 'installing'] },
  }).sort({ createdAt: 1 });

  return downloads.map((d, i) => ({
    id: d._id.toString(),
    bundleId: d.bundleId,
    appName: d.appName,
    appIcon: d.appIcon,
    type: d.type,
    status: d.status,
    progress: d.progress,
    queuePosition: i + 1,
    downloadSpeed: d.downloadSpeed,
    etaSeconds: d.etaSeconds,
    size: d.size,
    downloadedBytes: d.downloadedBytes,
  }));
}

export async function checkForUpdates(userId: string) {
  const installed = await InstalledApp.find({ userId }).populate('appId');
  const updates = [];

  for (const item of installed) {
    const app = item.appId as unknown as InstanceType<typeof App>;
    if (app.version !== item.installedVersion) {
      updates.push({
        bundleId: item.bundleId,
        name: app.name,
        icon: app.icon,
        installedVersion: item.installedVersion,
        latestVersion: app.version,
      });
    }
  }

  return updates;
}

export function cancelAllUserJobs(userId: string): void {
  for (const [id, job] of activeJobs) {
    if (job.userId === userId) {
      clearInterval(job.intervalId);
      activeJobs.delete(id);
    }
  }
  userQueues.delete(userId);
}

/** @deprecated Use enqueueDownload instead */
export const startDownloadSimulation = enqueueDownload;
