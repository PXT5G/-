import { Types } from 'mongoose';
import { PhonePermission, PhonePermissionName, USER_DEFAULT_PERMISSIONS, ADMIN_PERMISSIONS } from '../database/models/PhonePermission';
import { PhoneAuditLog } from '../database/models/PhoneAuditLog';
import { PhoneCallSettings, IPhoneCallSettings } from '../database/models/PhoneCallSettings';
import { PhoneFavoriteContact, IPhoneFavoriteContact } from '../database/models/PhoneFavoriteContact';
import { PhoneBlockedNumber, IPhoneBlockedNumber } from '../database/models/PhoneBlockedNumber';
import { ActiveCall } from '../database/models/ActiveCall';
import { CallHistory } from '../database/models/CallHistory';
import { PhoneVoicemail } from '../database/models/PhoneVoicemail';
import { Call } from '../database/models/Call';
import { Identity } from '../database/models/Identity';
import { SIMProfile } from '../database/models/SIMProfile';
import { PhoneNumber } from '../database/models/PhoneNumber';
import { Contact } from '../database/models/Contact';
import {
  auditService,
  eventBusService,
  notificationService,
  permissionEngineService,
  BANANAOS_APP_IDS,
} from '../platform';

export const PHONE_APP_ID = BANANAOS_APP_IDS.PHONE;

export interface AuditContext {
  performedBy: string;
  performedByRole: string;
  permission: PhonePermissionName;
  deviceId?: string;
  ipAddress?: string;
  reason?: string;
}

export async function hasPermission(
  userId: string,
  permission: PhonePermissionName,
  userRole: 'user' | 'admin'
): Promise<boolean> {
  const result = await permissionEngineService.hasPermission(PHONE_APP_ID, userId, permission, userRole);
  return result.granted;
}

export async function requirePermission(
  userId: string,
  permission: PhonePermissionName,
  userRole: 'user' | 'admin'
): Promise<void> {
  const allowed = await hasPermission(userId, permission, userRole);
  if (!allowed) throw new Error(`Permission denied: ${permission}`);
}

export async function grantDefaultPermissions(userId: string, grantedBy: string): Promise<void> {
  await permissionEngineService.grantPermissions(PHONE_APP_ID, userId, [...USER_DEFAULT_PERMISSIONS], grantedBy);
}

export async function grantAdminPermissions(userId: string): Promise<void> {
  await permissionEngineService.grantPermissions(PHONE_APP_ID, userId, [...ADMIN_PERMISSIONS], userId);
}

export async function logPhoneAudit(
  targetUserId: string,
  action: string,
  entityType: string,
  ctx: AuditContext,
  options?: {
    entityId?: string;
    callId?: string;
    phoneNumber?: string;
    query?: string;
    oldValue?: string;
    newValue?: string;
    reason?: string;
  }
): Promise<void> {
  await auditService.log({
    appId: PHONE_APP_ID,
    userId: targetUserId,
    action,
    entityType,
    entityId: options?.entityId,
    ctx,
    query: options?.query,
    oldValue: options?.oldValue,
    newValue: options?.newValue,
    reason: options?.reason ?? ctx.reason,
    metadata: options?.callId ? { callId: options.callId } : undefined,
  });

  await PhoneAuditLog.create({
    userId: targetUserId,
    callId: options?.callId ? new Types.ObjectId(options.callId) : undefined,
    action,
    entityType,
    entityId: options?.entityId ? new Types.ObjectId(options.entityId) : undefined,
    performedBy: new Types.ObjectId(ctx.performedBy),
    performedByRole: ctx.performedByRole,
    permission: ctx.permission,
    deviceId: ctx.deviceId,
    ipAddress: ctx.ipAddress,
    phoneNumber: options?.phoneNumber,
    query: options?.query,
    oldValue: options?.oldValue,
    newValue: options?.newValue,
    reason: options?.reason ?? ctx.reason,
  });
}

export async function notify(
  userId: string,
  title: string,
  body: string,
  priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
): Promise<void> {
  await notificationService.send({
    userId,
    appId: PHONE_APP_ID,
    title,
    body,
    priority,
    domainEvent: 'phone:notification',
    domainPayload: { title, body, priority },
  });
}

export async function ensurePhoneSettings(userId: string): Promise<IPhoneCallSettings> {
  let settings = await PhoneCallSettings.findOne({ userId });
  if (!settings) {
    settings = await PhoneCallSettings.create({
      userId,
      createdBy: userId,
      updatedBy: userId,
    });
  }
  return settings;
}

export async function getUserPhoneNumber(userId: string): Promise<string | null> {
  const sim = await SIMProfile.findOne({ userId, isPrimary: true, status: 'active' });
  if (!sim) return null;
  const pn = await PhoneNumber.findById(sim.phoneNumberId);
  return pn?.number ?? null;
}

export async function resolveUserByPhone(phoneNumber: string): Promise<string | null> {
  const normalized = normalizePhone(phoneNumber);
  const pn = await PhoneNumber.findOne({ number: normalized, status: 'assigned' });
  return pn?.userId?.toString() ?? null;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits.startsWith('+') ? digits : `+${digits}`;
}

export async function resolveContactDisplay(
  userId: string,
  phoneNumber: string,
  contactId?: string
): Promise<{ displayName: string; contactId?: string; avatar?: string }> {
  if (contactId) {
    const contact = await Contact.findOne({ _id: contactId, userId });
    if (contact) {
      return { displayName: contact.fullName, contactId: contact._id.toString(), avatar: contact.avatar };
    }
  }
  const contact = await Contact.findOne({ userId, 'phoneNumbers.number': phoneNumber });
  if (contact) {
    return { displayName: contact.fullName, contactId: contact._id.toString(), avatar: contact.avatar };
  }
  return { displayName: formatDisplayNumber(phoneNumber) };
}

export function formatDisplayNumber(phone: string): string {
  const n = phone.replace(/[^\d]/g, '');
  if (n.length === 11 && n.startsWith('1')) {
    return `+1 (${n.slice(1, 4)}) ${n.slice(4, 7)}-${n.slice(7)}`;
  }
  return phone;
}

export async function isNumberBlocked(userId: string, phoneNumber: string): Promise<boolean> {
  const normalized = normalizePhone(phoneNumber);
  const blocked = await PhoneBlockedNumber.findOne({
    userId,
    phoneNumber: normalized,
    blockType: { $in: ['call', 'both'] },
  });
  return !!blocked;
}

export async function initPhone(userId: string, ctx: AuditContext): Promise<{ initialized: boolean }> {
  const identity = await Identity.findOne({ userId, verified: true });
  if (!identity) throw new Error('Verified identity required for Phone');

  const sim = await SIMProfile.findOne({ userId, isPrimary: true, status: 'active' });
  if (!sim) throw new Error('Active SIM required for Phone');

  const permCount = await PhonePermission.countDocuments({ userId });
  if (permCount === 0) {
    await grantDefaultPermissions(userId, ctx.performedBy);
  }

  await ensurePhoneSettings(userId);
  await logPhoneAudit(userId, 'phone_initialized', 'PhoneCallSettings', ctx);
  return { initialized: true };
}

export async function getDashboard(userId: string) {
  const [phoneNumber, settings, activeCall, missedCount, unreadVoicemail, favoritesCount, recentCount] = await Promise.all([
    getUserPhoneNumber(userId),
    ensurePhoneSettings(userId),
    ActiveCall.findOne({ ownerUserId: userId }),
    CallHistory.countDocuments({ userId, direction: 'incoming', status: 'missed' }),
    PhoneVoicemail.countDocuments({ userId, isRead: false, deletedAt: { $exists: false } }),
    PhoneFavoriteContact.countDocuments({ userId }),
    CallHistory.countDocuments({ userId }),
  ]);

  return {
    phoneNumber,
    simActive: !!phoneNumber,
    settings: formatSettings(settings),
    activeCall: activeCall ? { id: activeCall._id.toString(), callId: activeCall.callId.toString(), state: activeCall.state, displayName: activeCall.displayName } : null,
    missedCalls: missedCount,
    unreadVoicemail,
    favoritesCount,
    recentCount,
  };
}

export function formatSettings(s: IPhoneCallSettings) {
  return {
    callerIdEnabled: s.callerIdEnabled,
    showMyNumber: s.showMyNumber,
    autoRejectUnknown: s.autoRejectUnknown,
    silenceUnknownCallers: s.silenceUnknownCallers,
    callWaiting: s.callWaiting,
    callForwardingEnabled: s.callForwardingEnabled,
    callForwardingNumber: s.callForwardingNumber,
    voicemailEnabled: s.voicemailEnabled,
    voicemailGreeting: s.voicemailGreeting,
    recordCalls: s.recordCalls,
    hapticFeedback: s.hapticFeedback,
    dynamicIslandEnabled: s.dynamicIslandEnabled,
  };
}

export async function updateSettings(
  userId: string,
  data: Partial<IPhoneCallSettings>,
  ctx: AuditContext
) {
  await requirePermission(userId, 'manage_settings', ctx.performedByRole as 'user' | 'admin');
  const settings = await ensurePhoneSettings(userId);
  const allowed: (keyof IPhoneCallSettings)[] = ['callerIdEnabled', 'showMyNumber', 'autoRejectUnknown', 'silenceUnknownCallers', 'callWaiting', 'callForwardingEnabled', 'callForwardingNumber', 'voicemailEnabled', 'voicemailGreeting', 'recordCalls', 'hapticFeedback', 'dynamicIslandEnabled'];
  for (const key of allowed) {
    if (data[key] !== undefined) settings[key] = data[key] as never;
  }
  settings.updatedBy = new Types.ObjectId(userId);
  await settings.save();
  await logPhoneAudit(userId, 'settings_updated', 'PhoneCallSettings', ctx, { entityId: settings._id.toString() });
  return formatSettings(settings);
}

export function formatFavorite(f: Pick<IPhoneFavoriteContact, '_id' | 'contactId' | 'phoneNumber' | 'label' | 'position' | 'avatar'>) {
  return {
    id: f._id.toString(),
    contactId: f.contactId?.toString(),
    phoneNumber: f.phoneNumber,
    label: f.label,
    position: f.position,
    avatar: f.avatar,
  };
}

export async function listFavorites(userId: string) {
  const favorites = await PhoneFavoriteContact.find({ userId }).sort({ position: 1 }).lean();
  return favorites.map((f) => formatFavorite(f));
}

export async function addFavorite(
  userId: string,
  data: { phoneNumber: string; label: string; contactId?: string; position?: number },
  ctx: AuditContext
) {
  await requirePermission(userId, 'manage_favorites', ctx.performedByRole as 'user' | 'admin');
  const phoneNumber = normalizePhone(data.phoneNumber);
  const existing = await PhoneFavoriteContact.findOne({ userId, phoneNumber });
  if (existing) throw new Error('Number already in favorites');

  const count = await PhoneFavoriteContact.countDocuments({ userId });
  const fav = await PhoneFavoriteContact.create({
    userId,
    contactId: data.contactId ? new Types.ObjectId(data.contactId) : undefined,
    phoneNumber,
    label: data.label,
    position: data.position ?? count,
    createdBy: userId,
    updatedBy: userId,
  });
  await logPhoneAudit(userId, 'favorite_added', 'PhoneFavoriteContact', ctx, { entityId: fav._id.toString(), phoneNumber });
  return formatFavorite(fav);
}

export async function removeFavorite(userId: string, favoriteId: string, ctx: AuditContext) {
  await requirePermission(userId, 'manage_favorites', ctx.performedByRole as 'user' | 'admin');
  const fav = await PhoneFavoriteContact.findOneAndDelete({ _id: favoriteId, userId });
  if (!fav) throw new Error('Favorite not found');
  await logPhoneAudit(userId, 'favorite_removed', 'PhoneFavoriteContact', ctx, { entityId: favoriteId, phoneNumber: fav.phoneNumber });
}

export async function reorderFavorites(userId: string, orderedIds: string[], ctx: AuditContext) {
  await requirePermission(userId, 'manage_favorites', ctx.performedByRole as 'user' | 'admin');
  for (let i = 0; i < orderedIds.length; i++) {
    await PhoneFavoriteContact.findOneAndUpdate({ _id: orderedIds[i], userId }, { position: i, updatedBy: userId });
  }
  await logPhoneAudit(userId, 'favorites_reordered', 'PhoneFavoriteContact', ctx);
  return listFavorites(userId);
}

export function formatBlocked(b: Pick<IPhoneBlockedNumber, '_id' | 'phoneNumber' | 'label' | 'reason' | 'blockType' | 'createdAt'>) {
  return {
    id: b._id.toString(),
    phoneNumber: b.phoneNumber,
    label: b.label,
    reason: b.reason,
    blockType: b.blockType,
    createdAt: b.createdAt.toISOString(),
  };
}

export async function listBlocked(userId: string) {
  const blocked = await PhoneBlockedNumber.find({ userId }).sort({ createdAt: -1 }).lean();
  return blocked.map((b) => formatBlocked(b));
}

export async function blockNumber(
  userId: string,
  data: { phoneNumber: string; label?: string; reason?: string; blockType?: 'call' | 'sms' | 'both' },
  ctx: AuditContext
) {
  await requirePermission(userId, 'block_numbers', ctx.performedByRole as 'user' | 'admin');
  const phoneNumber = normalizePhone(data.phoneNumber);
  const blocked = await PhoneBlockedNumber.findOneAndUpdate(
    { userId, phoneNumber },
    {
      userId,
      phoneNumber,
      label: data.label,
      reason: data.reason,
      blockType: data.blockType ?? 'call',
      createdBy: userId,
      updatedBy: userId,
    },
    { upsert: true, new: true }
  );
  await logPhoneAudit(userId, 'number_blocked', 'PhoneBlockedNumber', ctx, { entityId: blocked._id.toString(), phoneNumber });
  return formatBlocked(blocked);
}

export async function unblockNumber(userId: string, blockedId: string, ctx: AuditContext) {
  await requirePermission(userId, 'block_numbers', ctx.performedByRole as 'user' | 'admin');
  const blocked = await PhoneBlockedNumber.findOneAndDelete({ _id: blockedId, userId });
  if (!blocked) throw new Error('Blocked number not found');
  await logPhoneAudit(userId, 'number_unblocked', 'PhoneBlockedNumber', ctx, { entityId: blockedId, phoneNumber: blocked.phoneNumber });
}

export async function searchContacts(userId: string, query: string, ctx: AuditContext) {
  await requirePermission(userId, 'view_dashboard', ctx.performedByRole as 'user' | 'admin');
  const regex = new RegExp(query.trim(), 'i');
  const contacts = await Contact.find({
    userId,
    $or: [{ fullName: regex }, { 'phoneNumbers.number': regex }, { 'emails.address': regex }],
  }).limit(30).lean();

  await logPhoneAudit(userId, 'contacts_searched', 'Contact', ctx, { query, newValue: `${contacts.length} results` });

  return contacts.map((c) => ({
    id: c._id.toString(),
    fullName: c.fullName,
    primaryPhone: c.phoneNumbers?.[0]?.number,
    avatar: c.avatar,
    phoneNumbers: c.phoneNumbers,
  }));
}

export async function getAuditLogs(userId: string, limit = 50) {
  const logs = await PhoneAuditLog.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
  return logs.map((l) => ({
    id: l._id.toString(),
    action: l.action,
    entityType: l.entityType,
    phoneNumber: l.phoneNumber,
    performedByRole: l.performedByRole,
    createdAt: l.createdAt.toISOString(),
  }));
}

export { eventBusService };
