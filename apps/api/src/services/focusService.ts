import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { FocusProfile } from '../database/models/FocusProfile';
import { FOCUS_APP_BUNDLE, type FocusProfileType } from '../constants/focus';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';
import { emitToUser } from './socketService';

function pid() { return `FCS-${uuidv4().slice(0, 8).toUpperCase()}`; }

async function assertFocus(userId: string) {
  const allowed = await checkPermission(userId, FOCUS_APP_BUNDLE, 'notifications');
  if (!allowed) throw new Error('FOCUS_PERMISSION_DENIED');
}

const DEFAULT_PROFILES: { type: FocusProfileType; name: string; icon: string; blockedApps: string[] }[] = [
  { type: 'work', name: 'Work', icon: '💼', blockedApps: ['com.gulfos.gallery', 'com.gulfos.camera'] },
  { type: 'sleep', name: 'Sleep', icon: '😴', blockedApps: ['com.gulfos.exchange', 'com.gulfos.chat'] },
  { type: 'driving', name: 'Driving', icon: '🚗', blockedApps: ['com.gulfos.messages', 'com.gulfos.mail'] },
  { type: 'personal', name: 'Personal', icon: '🏠', blockedApps: [] },
];

export async function initializeFocus(userId: string, actorId: string) {
  await assertFocus(userId);
  const count = await FocusProfile.countDocuments({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (count === 0) {
    for (const p of DEFAULT_PROFILES) {
      await FocusProfile.create({
        profileId: pid(),
        userId: new Types.ObjectId(userId),
        name: p.name,
        type: p.type,
        icon: p.icon,
        blockedApps: p.blockedApps,
        createdBy: new Types.ObjectId(actorId),
      });
    }
  }
  return { initialized: true };
}

export async function listProfiles(userId: string) {
  await assertFocus(userId);
  const profiles = await FocusProfile.find({ userId: new Types.ObjectId(userId), deletedAt: null });
  return profiles.map(formatProfile);
}

export async function getActiveProfile(userId: string) {
  await assertFocus(userId);
  const active = await FocusProfile.findOne({ userId: new Types.ObjectId(userId), isActive: true, deletedAt: null });
  return active ? formatProfile(active) : null;
}

export async function enableFocus(userId: string, profileId: string, actorId: string) {
  await assertFocus(userId);
  await FocusProfile.updateMany({ userId: new Types.ObjectId(userId) }, { isActive: false });
  const profile = await FocusProfile.findOneAndUpdate(
    { profileId, userId: new Types.ObjectId(userId), deletedAt: null },
    { isActive: true, updatedBy: new Types.ObjectId(actorId) },
    { new: true }
  );
  if (!profile) throw new Error('FOCUS_PROFILE_NOT_FOUND');
  emitToUser(userId, 'focus:enabled', { profileId, name: profile.name, type: profile.type });
  await logAudit({ userId, actorId, action: 'focus_enable', resource: 'focus', resourceId: profileId });
  return formatProfile(profile);
}

export async function disableFocus(userId: string, actorId: string) {
  await assertFocus(userId);
  await FocusProfile.updateMany({ userId: new Types.ObjectId(userId) }, { isActive: false });
  emitToUser(userId, 'focus:disabled', {});
  await logAudit({ userId, actorId, action: 'focus_disable', resource: 'focus' });
  return { disabled: true };
}

export async function createProfile(userId: string, input: {
  name: string; type: FocusProfileType; icon?: string;
  allowedApps?: string[]; blockedApps?: string[];
}, actorId: string) {
  await assertFocus(userId);
  const doc = await FocusProfile.create({
    profileId: pid(),
    userId: new Types.ObjectId(userId),
    name: input.name,
    type: input.type,
    icon: input.icon,
    allowedApps: input.allowedApps ?? [],
    blockedApps: input.blockedApps ?? [],
    createdBy: new Types.ObjectId(actorId),
  });
  emitToUser(userId, 'focus:updated', { profileId: doc.profileId });
  return formatProfile(doc);
}

export async function updateProfile(userId: string, profileId: string, input: Partial<{
  name: string; allowedApps: string[]; blockedApps: string[];
  schedules: { scheduleId: string; startTime: string; endTime: string; days: number[] }[];
}>, actorId: string) {
  await assertFocus(userId);
  const profile = await FocusProfile.findOne({ profileId, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!profile) throw new Error('FOCUS_PROFILE_NOT_FOUND');
  if (input.name) profile.name = input.name;
  if (input.allowedApps) profile.allowedApps = input.allowedApps;
  if (input.blockedApps) profile.blockedApps = input.blockedApps;
  if (input.schedules) profile.schedules = input.schedules;
  profile.updatedBy = new Types.ObjectId(actorId);
  await profile.save();
  emitToUser(userId, 'focus:updated', { profileId });
  return formatProfile(profile);
}

function formatProfile(p: InstanceType<typeof FocusProfile>) {
  return {
    profileId: p.profileId, name: p.name, type: p.type, icon: p.icon, color: p.color,
    isActive: p.isActive, allowedApps: p.allowedApps, blockedApps: p.blockedApps,
    allowedContacts: p.allowedContacts, blockedContacts: p.blockedContacts,
    schedules: p.schedules, locationRules: p.locationRules, automationIds: p.automationIds,
  };
}

export { FOCUS_APP_BUNDLE };
