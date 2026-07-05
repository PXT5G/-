import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { Contact } from '../database/models/Contact';
import { CONTACTS_APP_BUNDLE, CONTACTS_SOCKET_EVENTS, type ContactCategory } from '../constants/contacts';
import { checkPermission } from './permissionBrokerService';
import { emitToUser } from './socketService';
import { logAudit } from './auditService';

function contactId() {
  return `CNT-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function formatContact(doc: InstanceType<typeof Contact>) {
  return {
    contactId: doc.contactId,
    category: doc.category,
    firstName: doc.firstName,
    lastName: doc.lastName,
    displayName: doc.displayName,
    company: doc.company,
    department: doc.department,
    jobTitle: doc.jobTitle,
    relationship: doc.relationship,
    phones: doc.phones,
    emails: doc.emails,
    addresses: doc.addresses,
    website: doc.website,
    socialLinks: doc.socialLinks,
    iban: doc.iban,
    businessAccountId: doc.businessAccountId,
    birthday: doc.birthday?.toISOString(),
    notes: doc.notes,
    photoUrl: doc.photoUrl,
    tags: doc.tags,
    groupIds: doc.groupIds,
    favorite: doc.favorite,
    emergency: doc.emergency,
    blocked: doc.blocked,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

async function assertContacts(userId: string) {
  const allowed = await checkPermission(userId, CONTACTS_APP_BUNDLE, 'contacts');
  if (!allowed) throw new Error('CONTACTS_PERMISSION_DENIED');
}

export async function initializeContacts(userId: string, actorId: string) {
  const existing = await Contact.countDocuments({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (existing > 0) return { initialized: true, count: existing };

  const defaults = [
    { firstName: 'Gulf', lastName: 'Emergency', displayName: 'Gulf Emergency', category: 'emergency' as ContactCategory, phones: [{ label: 'mobile', number: '911', primary: true }], emergency: true },
    { firstName: 'Police', lastName: 'Direct', displayName: 'Police Direct', category: 'police' as ContactCategory, phones: [{ label: 'work', number: 'POLICE', primary: true }] },
    { firstName: 'EMS', lastName: 'Direct', displayName: 'EMS Direct', category: 'ems' as ContactCategory, phones: [{ label: 'work', number: 'EMS', primary: true }] },
    { firstName: 'Justice', lastName: 'Hotline', displayName: 'Justice Hotline', category: 'justice' as ContactCategory, phones: [{ label: 'work', number: 'JUSTICE', primary: true }] },
  ];

  for (const d of defaults) {
    await Contact.create({
      contactId: contactId(),
      userId: new Types.ObjectId(userId),
      ...d,
      createdBy: new Types.ObjectId(actorId),
    });
  }

  await logAudit({ userId, actorId, action: 'contacts_initialize', resource: 'contacts' });
  return { initialized: true, count: defaults.length };
}

export async function listContacts(
  userId: string,
  options: { category?: ContactCategory; favorite?: boolean; search?: string; limit?: number; offset?: number } = {}
) {
  await assertContacts(userId);
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId), deletedAt: null };
  if (options.category) filter.category = options.category;
  if (options.favorite !== undefined) filter.favorite = options.favorite;
  if (options.search) {
    const regex = new RegExp(options.search, 'i');
    filter.$or = [{ displayName: regex }, { firstName: regex }, { lastName: regex }, { company: regex }];
  }

  const limit = Math.min(options.limit ?? 50, 200);
  const offset = options.offset ?? 0;

  const [contacts, total] = await Promise.all([
    Contact.find(filter).sort({ displayName: 1 }).skip(offset).limit(limit),
    Contact.countDocuments(filter),
  ]);

  return { contacts: contacts.map(formatContact), total, limit, offset };
}

export async function getContact(userId: string, contactIdParam: string) {
  await assertContacts(userId);
  const doc = await Contact.findOne({ contactId: contactIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) throw new Error('CONTACT_NOT_FOUND');
  return formatContact(doc);
}

export async function createContact(userId: string, input: Partial<InstanceType<typeof Contact>>, actorId: string) {
  await assertContacts(userId);
  const id = contactId();
  const displayName = input.displayName ?? `${input.firstName ?? ''} ${input.lastName ?? ''}`.trim();
  const doc = await Contact.create({
    contactId: id,
    userId: new Types.ObjectId(userId),
    category: input.category ?? 'personal',
    firstName: input.firstName ?? 'Contact',
    lastName: input.lastName ?? '',
    displayName,
    company: input.company,
    department: input.department,
    jobTitle: input.jobTitle,
    relationship: input.relationship,
    phones: input.phones ?? [],
    emails: input.emails ?? [],
    addresses: input.addresses ?? [],
    website: input.website,
    socialLinks: input.socialLinks ?? [],
    iban: input.iban,
    businessAccountId: input.businessAccountId,
    birthday: input.birthday,
    notes: input.notes,
    photoUrl: input.photoUrl,
    tags: input.tags ?? [],
    groupIds: input.groupIds ?? [],
    favorite: input.favorite ?? false,
    emergency: input.emergency ?? false,
    blocked: input.blocked ?? false,
    createdBy: new Types.ObjectId(actorId),
  });

  emitToUser(userId, 'contacts:updated', { contact: formatContact(doc) });
  await logAudit({ userId, actorId, action: 'contact_create', resource: 'contact', resourceId: id });
  return formatContact(doc);
}

export async function updateContact(userId: string, contactIdParam: string, updates: Record<string, unknown>, actorId: string) {
  await assertContacts(userId);
  const doc = await Contact.findOne({ contactId: contactIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) throw new Error('CONTACT_NOT_FOUND');

  Object.assign(doc, updates);
  if (updates.firstName || updates.lastName) {
    doc.displayName = String(updates.displayName ?? `${doc.firstName} ${doc.lastName}`.trim());
  }
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();

  emitToUser(userId, 'contacts:updated', { contact: formatContact(doc) });
  return formatContact(doc);
}

export async function deleteContact(userId: string, contactIdParam: string, actorId: string) {
  await assertContacts(userId);
  const doc = await Contact.findOne({ contactId: contactIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) throw new Error('CONTACT_NOT_FOUND');
  doc.deletedAt = new Date();
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();
  emitToUser(userId, 'contacts:updated', { contactId: contactIdParam, deleted: true });
  return { deleted: true };
}

export async function findDuplicates(userId: string) {
  await assertContacts(userId);
  const contacts = await Contact.find({ userId: new Types.ObjectId(userId), deletedAt: null });
  const byPhone = new Map<string, typeof contacts>();
  for (const c of contacts) {
    for (const p of c.phones) {
      const key = p.number.replace(/\D/g, '');
      if (!byPhone.has(key)) byPhone.set(key, []);
      byPhone.get(key)!.push(c);
    }
  }
  const duplicates: { number: string; contacts: ReturnType<typeof formatContact>[] }[] = [];
  for (const [number, group] of byPhone) {
    if (group.length > 1) {
      duplicates.push({ number, contacts: group.map(formatContact) });
    }
  }
  return duplicates;
}

export async function mergeContacts(userId: string, primaryId: string, mergeIds: string[], actorId: string) {
  await assertContacts(userId);
  const primary = await Contact.findOne({ contactId: primaryId, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!primary) throw new Error('CONTACT_NOT_FOUND');

  for (const mergeId of mergeIds) {
    const other = await Contact.findOne({ contactId: mergeId, userId: new Types.ObjectId(userId), deletedAt: null });
    if (!other) continue;
    primary.phones.push(...other.phones.filter((p) => !primary.phones.some((x) => x.number === p.number)));
    primary.emails.push(...other.emails.filter((e) => !primary.emails.some((x) => x.email === e.email)));
    primary.tags = [...new Set([...primary.tags, ...other.tags])];
    other.deletedAt = new Date();
    await other.save();
  }
  primary.updatedBy = new Types.ObjectId(actorId);
  await primary.save();

  emitToUser(userId, 'contacts:merged', { contact: formatContact(primary), mergedIds: mergeIds });
  return formatContact(primary);
}

export { CONTACTS_SOCKET_EVENTS, formatContact };
