import { Types } from 'mongoose';
import { Presence } from '../database/models/Presence';
import type { PresenceState } from '../constants/communication';
import { PRESENCE_IDLE_MS } from '../constants/communication';
import { emitToUser } from './socketService';
import { publishEvent } from './eventBusService';

function formatPresence(doc: InstanceType<typeof Presence>) {
  const visible = !doc.invisible && doc.state !== 'offline';
  return {
    userId: doc.userId.toString(),
    state: doc.invisible ? 'invisible' as const : doc.doNotDisturb ? 'dnd' as const : doc.state,
    customStatus: doc.customStatus,
    lastSeenAt: doc.lastSeenAt.toISOString(),
    lastActiveAt: doc.lastActiveAt.toISOString(),
    activeConversationId: doc.activeConversationId,
    online: visible && ['online', 'typing', 'recording_voice', 'uploading', 'downloading', 'reading'].includes(doc.state),
  };
}

export async function ensurePresence(userId: string) {
  let presence = await Presence.findOne({ userId, deletedAt: null });
  if (!presence) {
    presence = await Presence.create({ userId: new Types.ObjectId(userId), state: 'offline' });
  }
  return presence;
}

export async function getPresence(userId: string) {
  const presence = await ensurePresence(userId);
  return formatPresence(presence);
}

export async function setPresence(
  userId: string,
  state: PresenceState,
  options?: { customStatus?: string; conversationId?: string; deviceId?: string; actorId?: string }
) {
  const presence = await ensurePresence(userId);
  presence.state = state;
  presence.lastActiveAt = new Date();
  if (state === 'offline') presence.lastSeenAt = new Date();
  if (options?.customStatus !== undefined) presence.customStatus = options.customStatus;
  if (options?.conversationId !== undefined) presence.activeConversationId = options.conversationId;
  if (options?.deviceId !== undefined) presence.deviceId = options.deviceId;
  if (options?.actorId) presence.updatedBy = new Types.ObjectId(options.actorId);
  await presence.save();

  const data = formatPresence(presence);
  emitToUser(userId, 'presence:update', data);
  await publishEvent({ userId, namespace: 'communication.presence', event: 'presence:update', payload: data, source: 'presenceService' });
  return data;
}

export async function setInvisible(userId: string, invisible: boolean, actorId: string) {
  const presence = await ensurePresence(userId);
  presence.invisible = invisible;
  presence.updatedBy = new Types.ObjectId(actorId);
  await presence.save();
  return formatPresence(presence);
}

export async function setDoNotDisturb(userId: string, enabled: boolean, actorId: string) {
  const presence = await ensurePresence(userId);
  presence.doNotDisturb = enabled;
  presence.updatedBy = new Types.ObjectId(actorId);
  await presence.save();
  return formatPresence(presence);
}

export async function tickPresenceIdle(): Promise<number> {
  const cutoff = new Date(Date.now() - PRESENCE_IDLE_MS);
  const stale = await Presence.find({
    state: 'online',
    lastActiveAt: { $lt: cutoff },
    deletedAt: null,
  });
  for (const p of stale) {
    p.state = 'idle';
    await p.save();
    emitToUser(p.userId.toString(), 'presence:update', formatPresence(p));
  }
  return stale.length;
}

export async function getPresenceForUsers(userIds: string[]) {
  const objectIds = userIds.map((id) => new Types.ObjectId(id));
  const presences = await Presence.find({ userId: { $in: objectIds }, deletedAt: null });
  const map = new Map(presences.map((p) => [p.userId.toString(), formatPresence(p)]));
  return userIds.map((id) => map.get(id) ?? { userId: id, state: 'offline', online: false, lastSeenAt: new Date().toISOString(), lastActiveAt: new Date().toISOString() });
}
