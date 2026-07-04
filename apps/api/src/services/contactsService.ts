import { Types } from 'mongoose';
import { Contact, IContact, IPhoneNumber, buildFullName, getPrimaryPhone, PhoneLabel } from '../database/models/Contact';
import { ContactGroup } from '../database/models/ContactGroup';
import { FavoriteContact } from '../database/models/FavoriteContact';
import { BlockedContact } from '../database/models/BlockedContact';
import { Organization } from '../database/models/Organization';
import { ContactAuditLog } from '../database/models/ContactAuditLog';
import {
  ContactPermission,
  ContactPermissionName,
  USER_DEFAULT_CONTACT_PERMISSIONS,
  ADMIN_CONTACT_PERMISSIONS,
} from '../database/models/ContactPermission';
import { Identity } from '../database/models/Identity';
import { PhoneNumber } from '../database/models/PhoneNumber';
import {
  auditService,
  eventBusService,
  notificationService,
  permissionEngineService,
  BANANAOS_APP_IDS,
} from '../platform';

const CONTACTS_APP_ID = BANANAOS_APP_IDS.CONTACTS;

export interface AuditContext {
  performedBy: string;
  performedByRole: string;
  permission: ContactPermissionName;
  deviceId?: string;
  ipAddress?: string;
  reason?: string;
}

export interface ContactInput {
  type?: 'personal' | 'business' | 'emergency';
  firstName: string;
  lastName?: string;
  username?: string;
  phoneNumbers: IPhoneNumber[];
  identityNumber?: string;
  email?: string;
  organizationId?: string;
  department?: string;
  role?: string;
  address?: IContact['address'];
  birthday?: string;
  notes?: string;
  avatar?: string;
  tags?: string[];
  customLabels?: string[];
  relationshipLabel?: string;
  isEmergency?: boolean;
  groupIds?: string[];
}

export async function hasPermission(
  userId: string,
  permission: ContactPermissionName,
  userRole: 'user' | 'admin'
): Promise<boolean> {
  const result = await permissionEngineService.hasPermission(CONTACTS_APP_ID, userId, permission, userRole);
  return result.granted;
}

export async function requirePermission(
  userId: string,
  permission: ContactPermissionName,
  userRole: 'user' | 'admin'
): Promise<void> {
  const allowed = await hasPermission(userId, permission, userRole);
  if (!allowed) throw new Error(`Permission denied: ${permission}`);
}

export async function grantDefaultPermissions(userId: string, grantedBy: string): Promise<void> {
  await permissionEngineService.grantPermissions(CONTACTS_APP_ID, userId, [...USER_DEFAULT_CONTACT_PERMISSIONS], grantedBy);
}

export async function grantAdminPermissions(userId: string): Promise<void> {
  await permissionEngineService.grantPermissions(CONTACTS_APP_ID, userId, [...ADMIN_CONTACT_PERMISSIONS], userId);
}

export async function logContactAudit(
  targetUserId: string,
  action: string,
  entityType: string,
  ctx: AuditContext,
  entityId?: string,
  oldValue?: string,
  newValue?: string,
  reason?: string
): Promise<void> {
  await auditService.log({
    appId: CONTACTS_APP_ID,
    userId: targetUserId,
    action,
    entityType,
    entityId,
    ctx,
    oldValue,
    newValue,
    reason,
  });

  await ContactAuditLog.create({
    userId: targetUserId,
    action,
    entityType,
    entityId: entityId ? new Types.ObjectId(entityId) : undefined,
    performedBy: new Types.ObjectId(ctx.performedBy),
    performedByRole: ctx.performedByRole,
    permission: ctx.permission,
    deviceId: ctx.deviceId,
    ipAddress: ctx.ipAddress,
    oldValue,
    newValue,
    reason: reason ?? ctx.reason,
  });
}

async function sendContactNotification(
  userId: string,
  title: string,
  body: string,
  priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
): Promise<void> {
  await notificationService.send({ userId, appId: CONTACTS_APP_ID, title, body, priority });
}

export function formatContact(contact: IContact, orgName?: string) {
  return {
    id: contact._id.toString(),
    type: contact.type,
    firstName: contact.firstName,
    lastName: contact.lastName,
    fullName: contact.fullName,
    username: contact.username,
    phoneNumbers: contact.phoneNumbers,
    primaryPhone: getPrimaryPhone(contact),
    identityNumber: contact.identityNumber,
    email: contact.email,
    organizationId: contact.organizationId?.toString(),
    organizationName: orgName,
    department: contact.department,
    role: contact.role,
    status: contact.status,
    address: contact.address,
    birthday: contact.birthday?.toISOString(),
    notes: contact.notes,
    avatar: contact.avatar,
    tags: contact.tags,
    customLabels: contact.customLabels,
    relationshipLabel: contact.relationshipLabel,
    isFavorite: contact.isFavorite,
    isBlocked: contact.isBlocked,
    isEmergency: contact.isEmergency,
    groupIds: contact.groupIds.map((g) => g.toString()),
    lastContactedAt: contact.lastContactedAt?.toISOString(),
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}

export function normalizePhoneNumbers(
  numbers: Array<{ number: string; label?: PhoneLabel; primary?: boolean }>
): IPhoneNumber[] {
  return numbers.map((p, i) => ({
    number: p.number,
    label: p.label ?? 'mobile',
    primary: p.primary ?? i === 0,
  }));
}

export async function getDashboard(userId: string) {
  const [total, favorites, blocked, emergency, groups, recent, organizations] = await Promise.all([
    Contact.countDocuments({ userId, status: 'active' }),
    Contact.countDocuments({ userId, isFavorite: true, status: 'active' }),
    Contact.countDocuments({ userId, isBlocked: true }),
    Contact.countDocuments({ userId, isEmergency: true, status: 'active' }),
    ContactGroup.countDocuments({ userId }),
    Contact.find({ userId, status: 'active' }).sort({ lastContactedAt: -1 }).limit(5),
    Organization.countDocuments({ userId }),
  ]);

  const recentFormatted = await Promise.all(
    recent.map(async (c) => {
      const org = c.organizationId ? await Organization.findById(c.organizationId) : null;
      return formatContact(c, org?.name);
    })
  );

  return {
    totalContacts: total,
    favoriteCount: favorites,
    blockedCount: blocked,
    emergencyCount: emergency,
    groupCount: groups,
    organizationCount: organizations,
    recentContacts: recentFormatted,
  };
}

export async function createContact(userId: string, input: ContactInput, ctx: AuditContext): Promise<IContact> {
  await requirePermission(userId, 'edit_contacts', ctx.performedByRole as 'user' | 'admin');

  if (!input.phoneNumbers?.length) throw new Error('At least one phone number is required');

  const contact = await Contact.create({
    userId,
    type: input.type ?? 'personal',
    firstName: input.firstName,
    lastName: input.lastName,
    fullName: buildFullName(input.firstName, input.lastName),
    username: input.username,
    phoneNumbers: input.phoneNumbers,
    identityNumber: input.identityNumber,
    email: input.email,
    organizationId: input.organizationId ? new Types.ObjectId(input.organizationId) : undefined,
    department: input.department,
    role: input.role,
    address: input.address,
    birthday: input.birthday ? new Date(input.birthday) : undefined,
    notes: input.notes,
    avatar: input.avatar,
    tags: input.tags ?? [],
    customLabels: input.customLabels ?? [],
    relationshipLabel: input.relationshipLabel,
    isEmergency: input.isEmergency ?? input.type === 'emergency',
    groupIds: (input.groupIds ?? []).map((g) => new Types.ObjectId(g)),
  });

  await logContactAudit(userId, 'contact_created', 'Contact', ctx, contact._id.toString(), undefined, contact.fullName);
  eventBusService.emitToUser(userId, 'contacts:created', { contactId: contact._id.toString(), fullName: contact.fullName });
  return contact;
}

export async function updateContact(
  userId: string,
  contactId: string,
  input: Partial<ContactInput>,
  ctx: AuditContext
): Promise<IContact> {
  await requirePermission(userId, 'edit_contacts', ctx.performedByRole as 'user' | 'admin');

  const contact = await Contact.findOne({ _id: contactId, userId });
  if (!contact) throw new Error('Contact not found');

  const oldName = contact.fullName;
  if (input.firstName !== undefined) contact.firstName = input.firstName;
  if (input.lastName !== undefined) contact.lastName = input.lastName;
  if (input.username !== undefined) contact.username = input.username;
  if (input.phoneNumbers !== undefined) contact.phoneNumbers = input.phoneNumbers;
  if (input.identityNumber !== undefined) contact.identityNumber = input.identityNumber;
  if (input.email !== undefined) contact.email = input.email;
  if (input.organizationId !== undefined) contact.organizationId = input.organizationId ? new Types.ObjectId(input.organizationId) : undefined;
  if (input.department !== undefined) contact.department = input.department;
  if (input.role !== undefined) contact.role = input.role;
  if (input.type !== undefined) contact.type = input.type;
  if (input.address !== undefined) contact.address = input.address;
  if (input.birthday !== undefined) contact.birthday = input.birthday ? new Date(input.birthday) : undefined;
  if (input.notes !== undefined) contact.notes = input.notes;
  if (input.avatar !== undefined) contact.avatar = input.avatar;
  if (input.tags !== undefined) contact.tags = input.tags;
  if (input.customLabels !== undefined) contact.customLabels = input.customLabels;
  if (input.relationshipLabel !== undefined) contact.relationshipLabel = input.relationshipLabel;
  if (input.isEmergency !== undefined) contact.isEmergency = input.isEmergency;
  if (input.groupIds !== undefined) contact.groupIds = input.groupIds.map((g) => new Types.ObjectId(g));

  contact.fullName = buildFullName(contact.firstName, contact.lastName);
  await contact.save();

  await logContactAudit(userId, 'contact_updated', 'Contact', ctx, contactId, oldName, contact.fullName);
  eventBusService.emitToUser(userId, 'contacts:updated', { contactId, fullName: contact.fullName });
  return contact;
}

export async function deleteContact(userId: string, contactId: string, ctx: AuditContext): Promise<void> {
  await requirePermission(userId, 'delete_contacts', ctx.performedByRole as 'user' | 'admin');

  const contact = await Contact.findOne({ _id: contactId, userId });
  if (!contact) throw new Error('Contact not found');

  await FavoriteContact.deleteOne({ userId, contactId });
  await BlockedContact.deleteOne({ userId, contactId });
  await ContactGroup.updateMany({ userId }, { $pull: { contactIds: contact._id } });
  await contact.deleteOne();

  await logContactAudit(userId, 'contact_deleted', 'Contact', ctx, contactId, contact.fullName, undefined);
  eventBusService.emitToUser(userId, 'contacts:deleted', { contactId });
}

export async function searchContacts(
  userId: string,
  query: string,
  filters?: { type?: string; tag?: string; groupId?: string; favorite?: boolean; emergency?: boolean }
) {
  const filter: Record<string, unknown> = { userId, status: 'active' };
  if (filters?.type) filter.type = filters.type;
  if (filters?.tag) filter.tags = filters.tag;
  if (filters?.groupId) filter.groupIds = new Types.ObjectId(filters.groupId);
  if (filters?.favorite) filter.isFavorite = true;
  if (filters?.emergency) filter.isEmergency = true;

  if (query.trim().length >= 1) {
    const regex = new RegExp(query.trim(), 'i');
    filter.$or = [
      { fullName: regex },
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { username: regex },
      { 'phoneNumbers.number': regex },
      { tags: regex },
      { identityNumber: regex },
    ];
  }

  const contacts = await Contact.find(filter).sort({ fullName: 1 }).limit(100);
  return Promise.all(
    contacts.map(async (c) => {
      const org = c.organizationId ? await Organization.findById(c.organizationId) : null;
      return formatContact(c, org?.name);
    })
  );
}

export async function getContactById(userId: string, contactId: string) {
  const contact = await Contact.findOne({ _id: contactId, userId });
  if (!contact) return null;
  const org = contact.organizationId ? await Organization.findById(contact.organizationId) : null;
  return formatContact(contact, org?.name);
}

export async function lookupByPhone(userId: string, phone: string) {
  const normalized = phone.replace(/\s/g, '');
  const contact = await Contact.findOne({
    userId,
    status: 'active',
    'phoneNumbers.number': { $regex: normalized.replace(/[-+()]/g, ''), $options: 'i' },
  });
  if (!contact) return null;
  return formatContact(contact);
}

export async function toggleFavorite(userId: string, contactId: string, ctx: AuditContext): Promise<IContact> {
  await requirePermission(userId, 'edit_contacts', ctx.performedByRole as 'user' | 'admin');

  const contact = await Contact.findOne({ _id: contactId, userId });
  if (!contact) throw new Error('Contact not found');

  contact.isFavorite = !contact.isFavorite;
  await contact.save();

  if (contact.isFavorite) {
    await FavoriteContact.findOneAndUpdate(
      { userId, contactId },
      { sortOrder: Date.now() },
      { upsert: true }
    );
  } else {
    await FavoriteContact.deleteOne({ userId, contactId });
  }

  await logContactAudit(userId, contact.isFavorite ? 'contact_favorited' : 'contact_unfavorited', 'Contact', ctx, contactId);
  eventBusService.emitToUser(userId, 'contacts:favorite:changed', { contactId, isFavorite: contact.isFavorite });
  return contact;
}

export async function blockContact(userId: string, contactId: string, reason: string | undefined, ctx: AuditContext): Promise<IContact> {
  await requirePermission(userId, 'block_contacts', ctx.performedByRole as 'user' | 'admin');

  const contact = await Contact.findOne({ _id: contactId, userId });
  if (!contact) throw new Error('Contact not found');

  contact.isBlocked = true;
  await contact.save();
  await BlockedContact.findOneAndUpdate({ userId, contactId }, { reason }, { upsert: true });

  await logContactAudit(userId, 'contact_blocked', 'Contact', ctx, contactId, undefined, contact.fullName, reason);
  eventBusService.emitToUser(userId, 'contacts:blocked', { contactId });
  return contact;
}

export async function unblockContact(userId: string, contactId: string, ctx: AuditContext): Promise<IContact> {
  await requirePermission(userId, 'block_contacts', ctx.performedByRole as 'user' | 'admin');

  const contact = await Contact.findOne({ _id: contactId, userId });
  if (!contact) throw new Error('Contact not found');

  contact.isBlocked = false;
  await contact.save();
  await BlockedContact.deleteOne({ userId, contactId });

  await logContactAudit(userId, 'contact_unblocked', 'Contact', ctx, contactId);
  eventBusService.emitToUser(userId, 'contacts:unblocked', { contactId });
  return contact;
}

export async function recordContact(userId: string, contactId: string): Promise<void> {
  await Contact.findOneAndUpdate({ _id: contactId, userId }, { lastContactedAt: new Date() });
}

export async function importContacts(
  userId: string,
  contacts: ContactInput[],
  ctx: AuditContext
): Promise<{ imported: number; failed: number }> {
  await requirePermission(userId, 'import_contacts', ctx.performedByRole as 'user' | 'admin');

  let imported = 0;
  let failed = 0;

  for (const input of contacts) {
    try {
      if (!input.phoneNumbers?.length) { failed++; continue; }
      await Contact.create({
        userId,
        type: input.type ?? 'personal',
        firstName: input.firstName,
        lastName: input.lastName,
        fullName: buildFullName(input.firstName, input.lastName),
        phoneNumbers: input.phoneNumbers,
        email: input.email,
        notes: input.notes,
        tags: input.tags ?? [],
      });
      imported++;
    } catch {
      failed++;
    }
  }

  await logContactAudit(userId, 'contacts_imported', 'Contact', ctx, undefined, undefined, `${imported} contacts`);
  eventBusService.emitToUser(userId, 'contacts:imported', { imported, failed });
  await sendContactNotification(userId, 'Import Complete', `${imported} contacts imported successfully.`);
  return { imported, failed };
}

export async function exportContacts(userId: string, ctx: AuditContext) {
  await requirePermission(userId, 'export_contacts', ctx.performedByRole as 'user' | 'admin');

  const contacts = await Contact.find({ userId, status: 'active' });
  const formatted = contacts.map((c) => formatContact(c));

  await logContactAudit(userId, 'contacts_exported', 'Contact', ctx, undefined, undefined, `${contacts.length} contacts`);
  eventBusService.emitToUser(userId, 'contacts:exported', { count: contacts.length });
  return formatted;
}

export async function createGroup(userId: string, name: string, color?: string, icon?: string, ctx?: AuditContext) {
  if (ctx) await requirePermission(userId, 'manage_groups', ctx.performedByRole as 'user' | 'admin');

  const group = await ContactGroup.create({ userId, name, color, icon, contactIds: [] });
  if (ctx) await logContactAudit(userId, 'group_created', 'ContactGroup', ctx, group._id.toString(), undefined, name);
  eventBusService.emitToUser(userId, 'contacts:group:created', { groupId: group._id.toString(), name });
  return group;
}

export async function updateGroup(userId: string, groupId: string, data: { name?: string; color?: string; icon?: string }, ctx: AuditContext) {
  await requirePermission(userId, 'manage_groups', ctx.performedByRole as 'user' | 'admin');

  const group = await ContactGroup.findOneAndUpdate({ _id: groupId, userId }, data, { new: true });
  if (!group) throw new Error('Group not found');
  await logContactAudit(userId, 'group_updated', 'ContactGroup', ctx, groupId);
  return group;
}

export async function deleteGroup(userId: string, groupId: string, ctx: AuditContext) {
  await requirePermission(userId, 'manage_groups', ctx.performedByRole as 'user' | 'admin');

  const group = await ContactGroup.findOneAndDelete({ _id: groupId, userId });
  if (!group) throw new Error('Group not found');
  await Contact.updateMany({ userId, groupIds: groupId }, { $pull: { groupIds: group._id } });
  await logContactAudit(userId, 'group_deleted', 'ContactGroup', ctx, groupId, group.name);
  return group;
}

export async function addContactToGroup(userId: string, groupId: string, contactId: string, ctx: AuditContext) {
  await requirePermission(userId, 'manage_groups', ctx.performedByRole as 'user' | 'admin');

  const [group, contact] = await Promise.all([
    ContactGroup.findOne({ _id: groupId, userId }),
    Contact.findOne({ _id: contactId, userId }),
  ]);
  if (!group || !contact) throw new Error('Group or contact not found');

  if (!group.contactIds.some((id) => id.equals(contact._id))) {
    group.contactIds.push(contact._id);
    await group.save();
  }
  if (!contact.groupIds.some((id) => id.equals(group._id))) {
    contact.groupIds.push(group._id);
    await contact.save();
  }

  await logContactAudit(userId, 'contact_added_to_group', 'ContactGroup', ctx, groupId, undefined, contact.fullName);
  return group;
}

export async function createOrganization(userId: string, data: { name: string; industry?: string; website?: string; email?: string; phone?: string }, ctx: AuditContext) {
  await requirePermission(userId, 'manage_organizations', ctx.performedByRole as 'user' | 'admin');

  const org = await Organization.create({ userId, ...data });
  await logContactAudit(userId, 'organization_created', 'Organization', ctx, org._id.toString(), undefined, data.name);
  return org;
}

export async function getEmergencyContacts(userId: string) {
  const contacts = await Contact.find({ userId, isEmergency: true, status: 'active' }).sort({ fullName: 1 });
  return contacts.map((c) => formatContact(c));
}

export async function syncFromIdentity(userId: string, ctx: AuditContext): Promise<IContact | null> {
  const identity = await Identity.findOne({ userId, verified: true });
  if (!identity) return null;

  const existing = await Contact.findOne({ userId, identityNumber: identity.nationalId });
  if (existing) return existing;

  const simNumber = await PhoneNumber.findOne({ userId, status: 'assigned' });
  const phoneNumbers: IPhoneNumber[] = simNumber
    ? [{ number: simNumber.number, label: 'mobile', primary: true }]
    : [{ number: '+1-BNA-000-0000', label: 'mobile', primary: true }];

  const nameParts = identity.fullName.split(' ');
  const firstName = nameParts[0] ?? identity.fullName;
  const lastName = nameParts.slice(1).join(' ') || undefined;

  return createContact(
    userId,
    {
      type: 'personal',
      firstName,
      lastName,
      username: identity.username,
      identityNumber: identity.nationalId,
      phoneNumbers,
      notes: 'Auto-synced from BananaOS Identity',
      tags: ['identity', 'self'],
      avatar: identity.photo,
    },
    ctx
  );
}

export async function getAdminStats() {
  const [totalContacts, totalGroups, totalOrgs, totalBlocked, auditCount] = await Promise.all([
    Contact.countDocuments(),
    ContactGroup.countDocuments(),
    Organization.countDocuments(),
    BlockedContact.countDocuments(),
    ContactAuditLog.countDocuments(),
  ]);
  return { totalContacts, totalGroups, totalOrganizations: totalOrgs, totalBlocked, auditLogCount: auditCount };
}
