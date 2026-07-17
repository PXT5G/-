import crypto from 'crypto';
import { Types } from 'mongoose';
import { LiveActivity } from '../database/models/LiveActivity';
import type { LiveActivityType, LiveActivityState } from '../constants/phoneOs';
import { emitToUser } from './socketService';
import { logAudit } from './auditService';

function formatActivity(doc: InstanceType<typeof LiveActivity>) {
  return {
    id: doc.activityId,
    type: doc.type,
    state: doc.state,
    title: doc.title,
    subtitle: doc.subtitle,
    icon: doc.icon,
    progress: doc.progress,
    appId: doc.appId,
    payload: doc.payload,
    startedAt: doc.startedAt.toISOString(),
    endedAt: doc.endedAt?.toISOString(),
    expiresAt: doc.expiresAt?.toISOString(),
    dynamicIsland: doc.dynamicIsland,
    lockScreen: doc.lockScreen,
  };
}

export async function createLiveActivity(
  userId: string,
  input: {
    type: LiveActivityType;
    title: string;
    subtitle?: string;
    icon?: string;
    progress?: number;
    appId: string;
    payload?: Record<string, unknown>;
    dynamicIsland?: boolean;
    lockScreen?: boolean;
    expiresAt?: Date;
  },
  actorId: string
) {
  const activityId = crypto.randomUUID();
  const doc = await LiveActivity.create({
    userId: new Types.ObjectId(userId),
    activityId,
    type: input.type,
    state: 'active',
    title: input.title,
    subtitle: input.subtitle,
    icon: input.icon,
    progress: input.progress,
    appId: input.appId,
    payload: input.payload ?? {},
    dynamicIsland: input.dynamicIsland ?? true,
    lockScreen: input.lockScreen ?? true,
    expiresAt: input.expiresAt,
    createdBy: new Types.ObjectId(actorId),
  });

  const data = formatActivity(doc);
  emitToUser(userId, 'liveactivity:update', { action: 'created', activity: data });

  await logAudit({
    userId,
    actorId,
    action: 'live_activity_create',
    resource: 'live_activity',
    metadata: { activityId, type: input.type },
  });

  return data;
}

export async function updateLiveActivity(
  userId: string,
  activityId: string,
  updates: {
    title?: string;
    subtitle?: string;
    icon?: string;
    progress?: number;
    state?: LiveActivityState;
    payload?: Record<string, unknown>;
  },
  actorId: string
) {
  const doc = await LiveActivity.findOne({
    userId: new Types.ObjectId(userId),
    activityId,
    deletedAt: null,
  });
  if (!doc) throw new Error('ACTIVITY_NOT_FOUND');

  if (updates.title !== undefined) doc.title = updates.title;
  if (updates.subtitle !== undefined) doc.subtitle = updates.subtitle;
  if (updates.icon !== undefined) doc.icon = updates.icon;
  if (updates.progress !== undefined) doc.progress = updates.progress;
  if (updates.state !== undefined) {
    doc.state = updates.state;
    if (updates.state === 'ended' || updates.state === 'dismissed') {
      doc.endedAt = new Date();
    }
  }
  if (updates.payload !== undefined) doc.payload = updates.payload;
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();

  const data = formatActivity(doc);
  emitToUser(userId, 'liveactivity:update', { action: 'updated', activity: data });
  return data;
}

export async function endLiveActivity(userId: string, activityId: string, actorId: string) {
  return updateLiveActivity(userId, activityId, { state: 'ended' }, actorId);
}

export async function dismissLiveActivity(userId: string, activityId: string, actorId: string) {
  return updateLiveActivity(userId, activityId, { state: 'dismissed' }, actorId);
}

export async function getActiveLiveActivities(userId: string) {
  const docs = await LiveActivity.find({
    userId: new Types.ObjectId(userId),
    state: { $in: ['active', 'paused'] },
    deletedAt: null,
  }).sort({ startedAt: -1 });

  return docs.map(formatActivity);
}

export async function getLiveActivityHistory(userId: string, limit = 50) {
  const docs = await LiveActivity.find({
    userId: new Types.ObjectId(userId),
    deletedAt: null,
  })
    .sort({ startedAt: -1 })
    .limit(limit);

  return docs.map(formatActivity);
}

export async function expireStaleActivities() {
  const now = new Date();
  const stale = await LiveActivity.find({
    state: 'active',
    expiresAt: { $lte: now },
    deletedAt: null,
  });

  for (const doc of stale) {
    doc.state = 'ended';
    doc.endedAt = now;
    await doc.save();
    emitToUser(doc.userId.toString(), 'liveactivity:update', {
      action: 'expired',
      activity: formatActivity(doc),
    });
  }

  return stale.length;
}
