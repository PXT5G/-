import { Types } from 'mongoose';
import { BackgroundJob } from '../database/models/BackgroundJob';
import type { JobPriority, JobStatus } from '../database/models/BackgroundJob';
import { emitToUser } from './socketService';
import { logAudit } from './auditService';
import { publishEvent } from './eventBusService';

type JobHandler = (job: InstanceType<typeof BackgroundJob>) => Promise<Record<string, unknown>>;

const handlers = new Map<string, JobHandler>();

export function registerJobHandler(type: string, handler: JobHandler): void {
  handlers.set(type, handler);
}

function formatJob(job: InstanceType<typeof BackgroundJob>) {
  return {
    id: job._id.toString(),
    type: job.type,
    name: job.name,
    status: job.status,
    priority: job.priority,
    execution: job.execution,
    progress: job.progress,
    payload: job.payload,
    result: job.result,
    error: job.error,
    retryCount: job.retryCount,
    maxRetries: job.maxRetries,
    scheduledAt: job.scheduledAt?.toISOString(),
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    createdAt: job.createdAt.toISOString(),
  };
}

export async function createJob(params: {
  userId: string;
  type: string;
  name: string;
  payload?: Record<string, unknown>;
  priority?: JobPriority;
  execution?: 'background' | 'foreground';
  scheduledAt?: Date;
  recurringIntervalMs?: number;
  actorId: string;
}) {
  const job = await BackgroundJob.create({
    userId: new Types.ObjectId(params.userId),
    type: params.type,
    name: params.name,
    payload: params.payload ?? {},
    priority: params.priority ?? 'normal',
    execution: params.execution ?? 'background',
    scheduledAt: params.scheduledAt,
    recurringIntervalMs: params.recurringIntervalMs,
    nextRunAt: params.scheduledAt ?? new Date(),
    createdBy: new Types.ObjectId(params.actorId),
    status: params.scheduledAt && params.scheduledAt > new Date() ? 'queued' : 'queued',
  });

  await logAudit({
    userId: params.userId,
    actorId: params.actorId,
    action: 'create',
    resource: 'job',
    resourceId: job._id.toString(),
  });

  const data = formatJob(job);
  emitToUser(params.userId, 'job:update', data);
  return data;
}

export async function getJobs(userId: string, status?: JobStatus) {
  const filter: Record<string, unknown> = { userId, deletedAt: null };
  if (status) filter.status = status;
  const jobs = await BackgroundJob.find(filter).sort({ createdAt: -1 }).limit(100);
  return jobs.map(formatJob);
}

export async function getJob(userId: string, jobId: string) {
  const job = await BackgroundJob.findOne({ _id: jobId, userId, deletedAt: null });
  if (!job) throw new Error('JOB_NOT_FOUND');
  return formatJob(job);
}

export async function cancelJob(userId: string, jobId: string, actorId: string) {
  const job = await BackgroundJob.findOneAndUpdate(
    { _id: jobId, userId, status: { $in: ['queued', 'running', 'retry'] } },
    { status: 'cancelled', completedAt: new Date(), updatedBy: new Types.ObjectId(actorId) },
    { new: true }
  );
  if (!job) throw new Error('JOB_NOT_FOUND');
  const data = formatJob(job);
  emitToUser(userId, 'job:update', data);
  return data;
}

async function executeJob(job: InstanceType<typeof BackgroundJob>): Promise<void> {
  const handler = handlers.get(job.type);
  if (!handler) {
    job.status = 'failed';
    job.error = `No handler for job type: ${job.type}`;
    job.completedAt = new Date();
    await job.save();
    emitToUser(job.userId.toString(), 'job:update', formatJob(job));
    return;
  }

  job.status = 'running';
  job.startedAt = new Date();
  job.progress = 10;
  await job.save();
  emitToUser(job.userId.toString(), 'job:update', formatJob(job));

  try {
    const result = await handler(job);
    job.status = 'completed';
    job.progress = 100;
    job.result = result;
    job.completedAt = new Date();

    if (job.recurringIntervalMs) {
      job.status = 'queued';
      job.nextRunAt = new Date(Date.now() + job.recurringIntervalMs);
      job.progress = 0;
      job.startedAt = undefined;
      job.completedAt = undefined;
    }

    await job.save();
    emitToUser(job.userId.toString(), 'job:update', formatJob(job));
    await publishEvent({
      userId: job.userId.toString(),
      namespace: 'system.jobs',
      event: 'job:completed',
      payload: formatJob(job),
      source: 'jobService',
    });
  } catch (err) {
    job.retryCount += 1;
    if (job.retryCount < job.maxRetries) {
      job.status = 'retry';
      job.nextRunAt = new Date(Date.now() + job.retryCount * 5000);
      job.error = err instanceof Error ? err.message : 'Unknown error';
    } else {
      job.status = 'failed';
      job.error = err instanceof Error ? err.message : 'Unknown error';
      job.completedAt = new Date();
    }
    await job.save();
    emitToUser(job.userId.toString(), 'job:update', formatJob(job));
  }
}

export async function processJobQueue(): Promise<number> {
  const now = new Date();
  const jobs = await BackgroundJob.find({
    deletedAt: null,
    status: { $in: ['queued', 'retry'] },
    $or: [{ nextRunAt: { $lte: now } }, { nextRunAt: null }],
  })
    .sort({ priority: -1, createdAt: 1 })
    .limit(5);

  for (const job of jobs) {
    await executeJob(job);
  }
  return jobs.length;
}

export async function recoverCrashedJobs(): Promise<number> {
  const result = await BackgroundJob.updateMany(
    { status: 'running', deletedAt: null },
    { status: 'retry', nextRunAt: new Date() }
  );
  return result.modifiedCount;
}

export async function getJobStats(userId: string) {
  const [running, queued, failed] = await Promise.all([
    BackgroundJob.countDocuments({ userId, status: 'running', deletedAt: null }),
    BackgroundJob.countDocuments({ userId, status: { $in: ['queued', 'retry'] }, deletedAt: null }),
    BackgroundJob.countDocuments({ userId, status: 'failed', deletedAt: null }),
  ]);
  return { running, queued, failed };
}
