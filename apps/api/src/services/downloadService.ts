import { Types } from 'mongoose';
import { StoreDownload } from '../database/models/StoreDownload';
import { emitToUser } from './socketService';

interface DownloadJob {
  downloadId: string;
  userId: string;
  intervalId: ReturnType<typeof setInterval>;
}

const activeJobs = new Map<string, DownloadJob>();

export async function startDownloadSimulation(
  downloadId: string,
  userId: string
): Promise<void> {
  const download = await StoreDownload.findById(downloadId);
  if (!download) return;

  await StoreDownload.findByIdAndUpdate(downloadId, {
    status: 'downloading',
    startedAt: new Date(),
  });

  emitProgress(userId, downloadId, download.bundleId, 0, 'downloading');

  let progress = 0;
  const totalSize = download.size || 50_000_000;
  const step = Math.random() * 8 + 4;

  const intervalId = setInterval(async () => {
    progress = Math.min(100, progress + step);
    const downloadedBytes = Math.floor((progress / 100) * totalSize);

    await StoreDownload.findByIdAndUpdate(downloadId, {
      progress: Math.floor(progress),
      downloadedBytes,
    });

    emitProgress(userId, downloadId, download.bundleId, Math.floor(progress), 'downloading');

    if (progress >= 100) {
      clearInterval(intervalId);
      activeJobs.delete(downloadId);
      await completeDownload(downloadId, userId);
    }
  }, 200);

  activeJobs.set(downloadId, { downloadId, userId, intervalId });
}

export async function cancelDownload(downloadId: string, userId: string): Promise<void> {
  const job = activeJobs.get(downloadId);
  if (job) {
    clearInterval(job.intervalId);
    activeJobs.delete(downloadId);
  }

  await StoreDownload.findByIdAndUpdate(downloadId, {
    status: 'cancelled',
    completedAt: new Date(),
  });

  emitToUser(userId, 'store:download:cancelled' as never, {
    downloadId,
    timestamp: new Date().toISOString(),
  });
}

async function completeDownload(downloadId: string, userId: string): Promise<void> {
  await StoreDownload.findByIdAndUpdate(downloadId, {
    status: 'installing',
    progress: 100,
  });

  emitProgress(userId, downloadId, '', 100, 'installing');

  await new Promise((r) => setTimeout(r, 800));

  const download = await StoreDownload.findByIdAndUpdate(
    downloadId,
    { status: 'completed', completedAt: new Date() },
    { new: true }
  );

  if (download) {
    emitToUser(userId, 'store:download:complete' as never, {
      downloadId,
      bundleId: download.bundleId,
      type: download.type,
      version: download.targetVersion,
      timestamp: new Date().toISOString(),
    });
  }
}

function emitProgress(
  userId: string,
  downloadId: string,
  bundleId: string,
  progress: number,
  status: string
): void {
  emitToUser(userId, 'store:download:progress' as never, {
    downloadId,
    bundleId,
    progress,
    status,
    timestamp: new Date().toISOString(),
  });
}

export function cancelAllUserJobs(userId: string): void {
  for (const [id, job] of activeJobs) {
    if (job.userId === userId) {
      clearInterval(job.intervalId);
      activeJobs.delete(id);
    }
  }
}
