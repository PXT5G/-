import { Types } from 'mongoose';
import { PhoneEmergencyContact, IPhoneEmergencyContact } from '../database/models/PhoneEmergencyContact';
import { Contact } from '../database/models/Contact';
import {
  AuditContext,
  requirePermission,
  logPhoneAudit,
  notify,
  normalizePhone,
  eventBusService,
} from './phoneService';
import { makeCall } from './callService';

const EMERGENCY_SERVICES_NUMBER = '+1911';

function formatEmergencyEntry(e: Pick<IPhoneEmergencyContact, '_id' | 'contactId' | 'name' | 'phoneNumber' | 'relationship' | 'priority'>) {
  return {
    id: e._id.toString(),
    contactId: e.contactId?.toString(),
    name: e.name,
    phoneNumber: e.phoneNumber,
    relationship: e.relationship,
    priority: e.priority,
  };
}

export async function listEmergencyContacts(userId: string) {
  const contacts = await PhoneEmergencyContact.find({ userId }).sort({ priority: 1 }).lean();
  return contacts.map((c) => formatEmergencyEntry(c));
}

export async function addEmergencyContact(
  userId: string,
  data: { name: string; phoneNumber: string; relationship?: string; contactId?: string; priority?: number },
  ctx: AuditContext
) {
  await requirePermission(userId, 'emergency_call', ctx.performedByRole as 'user' | 'admin');

  const phoneNumber = normalizePhone(data.phoneNumber);
  const contact = await PhoneEmergencyContact.create({
    userId,
    contactId: data.contactId ? new Types.ObjectId(data.contactId) : undefined,
    name: data.name,
    phoneNumber,
    relationship: data.relationship ?? 'Emergency',
    priority: data.priority ?? 1,
    createdBy: userId,
    updatedBy: userId,
  });

  await logPhoneAudit(userId, 'emergency_contact_added', 'PhoneEmergencyContact', ctx, {
    entityId: contact._id.toString(),
    phoneNumber,
  });

  return formatEmergencyEntry(contact);
}

export async function removeEmergencyContact(userId: string, contactId: string, ctx: AuditContext) {
  await requirePermission(userId, 'emergency_call', ctx.performedByRole as 'user' | 'admin');

  const contact = await PhoneEmergencyContact.findOneAndDelete({ _id: contactId, userId });
  if (!contact) throw new Error('Emergency contact not found');

  await logPhoneAudit(userId, 'emergency_contact_removed', 'PhoneEmergencyContact', ctx, {
    entityId: contactId,
    phoneNumber: contact.phoneNumber,
  });
}

export async function syncFromContacts(userId: string, ctx: AuditContext) {
  await requirePermission(userId, 'emergency_call', ctx.performedByRole as 'user' | 'admin');

  const contacts = await Contact.find({ userId, isEmergency: true }).lean();
  let synced = 0;

  for (const c of contacts) {
    const phone = c.phoneNumbers?.[0]?.number;
    if (!phone) continue;

    const exists = await PhoneEmergencyContact.findOne({ userId, phoneNumber: normalizePhone(phone) });
    if (!exists) {
      await PhoneEmergencyContact.create({
        userId,
        contactId: c._id,
        name: c.fullName,
        phoneNumber: normalizePhone(phone),
        relationship: 'Emergency Contact',
        priority: synced + 1,
        createdBy: userId,
        updatedBy: userId,
      });
      synced++;
    }
  }

  await logPhoneAudit(userId, 'emergency_contacts_synced', 'PhoneEmergencyContact', ctx, { newValue: `${synced} synced` });
  return listEmergencyContacts(userId);
}

export async function placeEmergencyCall(userId: string, ctx: AuditContext) {
  await requirePermission(userId, 'emergency_call', ctx.performedByRole as 'user' | 'admin');

  await logPhoneAudit(userId, 'emergency_call_initiated', 'Call', ctx, {
    phoneNumber: EMERGENCY_SERVICES_NUMBER,
    reason: 'Emergency services',
  });

  await notify(userId, 'Emergency Call', 'Connecting to emergency services (911)...', 'critical');
  eventBusService.emitToUser(userId, 'phone:ringing', {
    phoneNumber: EMERGENCY_SERVICES_NUMBER,
    displayName: 'Emergency Services',
    direction: 'outgoing',
    isEmergency: true,
  });

  const result = await makeCall(userId, { phoneNumber: EMERGENCY_SERVICES_NUMBER }, ctx);
  return result;
}

export async function callEmergencyContact(
  userId: string,
  emergencyContactId: string,
  ctx: AuditContext
) {
  await requirePermission(userId, 'emergency_call', ctx.performedByRole as 'user' | 'admin');

  const contact = await PhoneEmergencyContact.findOne({ _id: emergencyContactId, userId });
  if (!contact) throw new Error('Emergency contact not found');

  await logPhoneAudit(userId, 'emergency_contact_called', 'PhoneEmergencyContact', ctx, {
    entityId: emergencyContactId,
    phoneNumber: contact.phoneNumber,
  });

  return makeCall(userId, { phoneNumber: contact.phoneNumber, contactId: contact.contactId?.toString() }, ctx);
}

export { formatEmergencyEntry as formatEmergency };
