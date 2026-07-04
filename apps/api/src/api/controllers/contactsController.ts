import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { Contact } from '../../database/models/Contact';
import { ContactGroup } from '../../database/models/ContactGroup';
import { Organization } from '../../database/models/Organization';
import { ContactAuditLog } from '../../database/models/ContactAuditLog';
import { ContactPermission } from '../../database/models/ContactPermission';
import {
  createContact,
  updateContact,
  deleteContact,
  searchContacts,
  getContactById,
  lookupByPhone,
  toggleFavorite,
  blockContact,
  unblockContact,
  recordContact,
  importContacts,
  exportContacts,
  createGroup,
  updateGroup,
  deleteGroup,
  addContactToGroup,
  createOrganization,
  getEmergencyContacts,
  getDashboard,
  syncFromIdentity,
  hasPermission,
  grantDefaultPermissions,
  logContactAudit,
  formatContact,
  AuditContext,
  normalizePhoneNumbers,
} from '../../services/contactsService';
import type { ContactInput } from '../../services/contactsService';
import type { ContactPermissionName } from '../../database/models/ContactPermission';

const phoneNumberSchema = z.object({
  number: z.string().min(1),
  label: z.enum(['mobile', 'home', 'work', 'other']).optional(),
  primary: z.boolean().optional(),
});

const contactSchema = z.object({
  type: z.enum(['personal', 'business', 'emergency']).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  username: z.string().max(50).optional(),
  phoneNumbers: z.array(phoneNumberSchema).min(1),
  identityNumber: z.string().optional(),
  email: z.string().email().optional(),
  organizationId: z.string().optional(),
  department: z.string().optional(),
  role: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  birthday: z.string().optional(),
  notes: z.string().optional(),
  avatar: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customLabels: z.array(z.string()).optional(),
  relationshipLabel: z.string().optional(),
  isEmergency: z.boolean().optional(),
  groupIds: z.array(z.string()).optional(),
});

function auditCtx(req: AuthRequest, permission: ContactPermissionName, reason?: string): AuditContext {
  return {
    performedBy: req.user!.userId,
    performedByRole: req.user!.role,
    permission,
    ipAddress: req.ip,
    deviceId: req.headers['x-device-id'] as string | undefined,
    reason,
  };
}

async function checkPerm(req: AuthRequest, permission: ContactPermissionName): Promise<void> {
  const allowed = await hasPermission(req.user!.userId, permission, req.user!.role);
  if (!allowed) throw new AppError(403, `Permission denied: ${permission}`);
}

export const initPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  await grantDefaultPermissions(req.user!.userId, req.user!.userId);
  const perms = await ContactPermission.find({ userId: req.user!.userId, granted: true });
  res.json({ success: true, data: perms.map((p) => p.permission) });
});

export const getPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const perms = await ContactPermission.find({ userId: req.user!.userId, granted: true });
  res.json({ success: true, data: perms.map((p) => p.permission) });
});

export const getDashboardData = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_contacts');
  const dashboard = await getDashboard(req.user!.userId);
  res.json({ success: true, data: dashboard });
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = contactSchema.parse(req.body);
  try {
    const contact = await createContact(req.user!.userId, { ...data, phoneNumbers: normalizePhoneNumbers(data.phoneNumbers) }, auditCtx(req, 'edit_contacts'));
    const org = contact.organizationId ? await Organization.findById(contact.organizationId) : null;
    res.status(201).json({ success: true, data: formatContact(contact, org?.name) });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Create failed');
  }
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = contactSchema.partial().parse(req.body);
  const { phoneNumbers, ...rest } = data;
  const payload: Partial<ContactInput> = {
    ...rest,
    ...(phoneNumbers ? { phoneNumbers: normalizePhoneNumbers(phoneNumbers) } : {}),
  };
  try {
    const contact = await updateContact(req.user!.userId, String(req.params.id), payload, auditCtx(req, 'edit_contacts'));
    const org = contact.organizationId ? await Organization.findById(contact.organizationId) : null;
    res.json({ success: true, data: formatContact(contact, org?.name) });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Update failed');
  }
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await deleteContact(req.user!.userId, String(req.params.id), auditCtx(req, 'delete_contacts'));
    res.json({ success: true, message: 'Contact deleted' });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Delete failed');
  }
});

export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_contacts');
  const contact = await getContactById(req.user!.userId, String(req.params.id));
  if (!contact) throw new AppError(404, 'Contact not found');
  res.json({ success: true, data: contact });
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_contacts');
  const q = String(req.query.q ?? '');
  const type = req.query.type as string | undefined;
  const tag = req.query.tag as string | undefined;
  const groupId = req.query.groupId as string | undefined;
  const favorite = req.query.favorite === 'true';
  const emergency = req.query.emergency === 'true';
  const results = await searchContacts(req.user!.userId, q, { type, tag, groupId, favorite, emergency });
  res.json({ success: true, data: results });
});

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_contacts');
  const filter: Record<string, unknown> = { userId: req.user!.userId, status: 'active' };
  if (req.query.favorite === 'true') filter.isFavorite = true;
  if (req.query.blocked === 'true') filter.isBlocked = true;
  if (req.query.emergency === 'true') filter.isEmergency = true;
  if (req.query.type) filter.type = req.query.type;

  const contacts = await Contact.find(filter).sort({ fullName: 1 }).limit(200);
  const formatted = await Promise.all(
    contacts.map(async (c) => {
      const org = c.organizationId ? await Organization.findById(c.organizationId) : null;
      return formatContact(c, org?.name);
    })
  );
  res.json({ success: true, data: formatted });
});

export const lookupPhone = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_contacts');
  const contact = await lookupByPhone(req.user!.userId, String(req.params.phone));
  if (!contact) throw new AppError(404, 'Contact not found');
  res.json({ success: true, data: contact });
});

export const toggleFavoriteHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const contact = await toggleFavorite(req.user!.userId, String(req.params.id), auditCtx(req, 'edit_contacts'));
    res.json({ success: true, data: { id: contact._id.toString(), isFavorite: contact.isFavorite } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Toggle failed');
  }
});

export const block = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ reason: z.string().optional() });
  const { reason } = schema.parse(req.body);
  try {
    const contact = await blockContact(req.user!.userId, String(req.params.id), reason, auditCtx(req, 'block_contacts', reason));
    res.json({ success: true, data: { id: contact._id.toString(), isBlocked: true } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Block failed');
  }
});

export const unblock = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const contact = await unblockContact(req.user!.userId, String(req.params.id), auditCtx(req, 'block_contacts'));
    res.json({ success: true, data: { id: contact._id.toString(), isBlocked: false } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Unblock failed');
  }
});

export const touch = asyncHandler(async (req: AuthRequest, res: Response) => {
  await recordContact(req.user!.userId, String(req.params.id));
  res.json({ success: true });
});

export const importHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ contacts: z.array(contactSchema) });
  const { contacts } = schema.parse(req.body);
  const normalized = contacts.map((c) => ({ ...c, phoneNumbers: normalizePhoneNumbers(c.phoneNumbers) }));
  try {
    const result = await importContacts(req.user!.userId, normalized, auditCtx(req, 'import_contacts'));
    res.json({ success: true, data: result });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Import failed');
  }
});

export const exportHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exportContacts(req.user!.userId, auditCtx(req, 'export_contacts'));
    res.json({ success: true, data });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Export failed');
  }
});

export const getFavorites = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_contacts');
  const contacts = await Contact.find({ userId: req.user!.userId, isFavorite: true, status: 'active' }).sort({ fullName: 1 });
  res.json({ success: true, data: contacts.map((c) => formatContact(c)) });
});

export const getRecent = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_contacts');
  const contacts = await Contact.find({ userId: req.user!.userId, status: 'active', lastContactedAt: { $exists: true } })
    .sort({ lastContactedAt: -1 })
    .limit(20);
  res.json({ success: true, data: contacts.map((c) => formatContact(c)) });
});

export const getEmergency = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_contacts');
  const contacts = await getEmergencyContacts(req.user!.userId);
  res.json({ success: true, data: contacts });
});

export const getGroups = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_contacts');
  const groups = await ContactGroup.find({ userId: req.user!.userId }).sort({ name: 1 });
  res.json({
    success: true,
    data: groups.map((g) => ({
      id: g._id.toString(),
      name: g.name,
      color: g.color,
      icon: g.icon,
      contactCount: g.contactIds.length,
      contactIds: g.contactIds.map((id) => id.toString()),
    })),
  });
});

export const createGroupHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ name: z.string().min(1), color: z.string().optional(), icon: z.string().optional() });
  const data = schema.parse(req.body);
  try {
    const group = await createGroup(req.user!.userId, data.name, data.color, data.icon, auditCtx(req, 'manage_groups'));
    res.status(201).json({ success: true, data: { id: group._id.toString(), name: group.name, color: group.color, icon: group.icon } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Create group failed');
  }
});

export const updateGroupHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ name: z.string().optional(), color: z.string().optional(), icon: z.string().optional() });
  const data = schema.parse(req.body);
  try {
    const group = await updateGroup(req.user!.userId, String(req.params.id), data, auditCtx(req, 'manage_groups'));
    res.json({ success: true, data: { id: group!._id.toString(), name: group!.name } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Update group failed');
  }
});

export const deleteGroupHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await deleteGroup(req.user!.userId, String(req.params.id), auditCtx(req, 'manage_groups'));
    res.json({ success: true, message: 'Group deleted' });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Delete group failed');
  }
});

export const addToGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ contactId: z.string() });
  const { contactId } = schema.parse(req.body);
  try {
    const group = await addContactToGroup(req.user!.userId, String(req.params.id), contactId, auditCtx(req, 'manage_groups'));
    res.json({ success: true, data: { id: group._id.toString(), contactCount: group.contactIds.length } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Add to group failed');
  }
});

export const getOrganizations = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_contacts');
  const orgs = await Organization.find({ userId: req.user!.userId }).sort({ name: 1 });
  res.json({ success: true, data: orgs.map((o) => ({ id: o._id.toString(), name: o.name, industry: o.industry, website: o.website })) });
});

export const createOrganizationHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ name: z.string().min(1), industry: z.string().optional(), website: z.string().optional(), email: z.string().optional(), phone: z.string().optional() });
  const data = schema.parse(req.body);
  try {
    const org = await createOrganization(req.user!.userId, data, auditCtx(req, 'manage_organizations'));
    res.status(201).json({ success: true, data: { id: org._id.toString(), name: org.name } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Create organization failed');
  }
});

export const syncIdentity = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const contact = await syncFromIdentity(req.user!.userId, auditCtx(req, 'edit_contacts'));
    if (!contact) throw new AppError(404, 'Verified identity not found');
    res.json({ success: true, data: formatContact(contact) });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Sync failed');
  }
});

export const getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_contacts');
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const logs = await ContactAuditLog.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).limit(limit);
  res.json({
    success: true,
    data: logs.map((l) => ({
      id: l._id.toString(),
      action: l.action,
      entityType: l.entityType,
      permission: l.permission,
      oldValue: l.oldValue,
      newValue: l.newValue,
      reason: l.reason,
      ipAddress: l.ipAddress,
      deviceId: l.deviceId,
      createdAt: l.createdAt.toISOString(),
    })),
  });
});
