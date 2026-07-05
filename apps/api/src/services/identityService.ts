import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { CitizenIdentity } from '../database/models/CitizenIdentity';
import { IdentityDocument } from '../database/models/IdentityDocument';
import { User } from '../database/models/User';
import type { DocumentType } from '../constants/identity';
import { IDENTITY_APP_BUNDLE } from '../constants/identity';
import { logAudit } from './auditService';
import { emitToUser } from './socketService';
import {
  assertIdentityAccess,
  requireIdentityPermission,
  generateNationalId,
  generateQrCode,
  generateNfcTagId,
  createDigitalSignature,
  getIdentityPermissions,
} from './identityRBACService';
import * as identityIntegration from './identityIntegrationService';

function identityId() { return `ID-${uuidv4().slice(0, 8).toUpperCase()}`; }
function documentId() { return `DOC-${uuidv4().slice(0, 8).toUpperCase()}`; }

export async function initializeIdentity(userId: string, actorId: string) {
  await assertIdentityAccess(userId);
  const existing = await CitizenIdentity.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!existing) {
    await provisionIdentity(userId, actorId);
  }
  await logAudit({ userId, actorId, action: 'identity_initialize', resource: 'identity' });
  const permissions = await getIdentityPermissions(userId);
  emitToUser(userId, 'identity:initialized', { permissions });
  return { initialized: true, permissions };
}

async function provisionIdentity(userId: string, actorId: string) {
  const user = await User.findById(userId);
  const fullName = user?.username ?? 'Citizen';
  const nid = generateNationalId(userId);
  const iid = identityId();
  const qr = generateQrCode(iid);
  const identity = await CitizenIdentity.create({
    identityId: iid,
    userId: new Types.ObjectId(userId),
    status: 'verified',
    role: 'citizen',
    fullName,
    nationalId: nid,
    nationality: 'GULF',
    qrCode: qr,
    nfcTagId: generateNfcTagId(iid),
    digitalSignatureHash: createDigitalSignature(iid, fullName),
    verifiedAt: new Date(),
    emergencyInfo: { allergies: [], medications: [], emergencyContacts: [] },
    createdBy: new Types.ObjectId(actorId),
  });
  await IdentityDocument.create({
    documentId: documentId(),
    userId: new Types.ObjectId(userId),
    identityId: iid,
    documentType: 'national_id',
    documentNumber: nid,
    title: 'National ID',
    issuedBy: 'GULF Government',
    issuedAt: new Date(),
    isVerified: true,
    verifiedAt: new Date(),
    createdBy: new Types.ObjectId(actorId),
  });
  return identity;
}

export async function getProfile(userId: string) {
  await assertIdentityAccess(userId);
  const identity = await CitizenIdentity.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!identity) throw new Error('IDENTITY_NOT_FOUND');
  return formatIdentity(identity);
}

export async function updateProfile(userId: string, input: Partial<{
  fullName: string; phone: string; email: string; address: string; city: string;
  postalCode: string; dateOfBirth: string; gender: string;
}>, actorId: string) {
  await requireIdentityPermission(userId, 'profile.manage');
  const identity = await CitizenIdentity.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!identity) throw new Error('IDENTITY_NOT_FOUND');
  if (input.fullName) identity.fullName = input.fullName;
  if (input.phone) identity.phone = input.phone;
  if (input.email) identity.email = input.email;
  if (input.address) identity.address = input.address;
  if (input.city) identity.city = input.city;
  if (input.postalCode) identity.postalCode = input.postalCode;
  if (input.dateOfBirth) identity.dateOfBirth = new Date(input.dateOfBirth);
  if (input.gender) identity.gender = input.gender;
  identity.updatedBy = new Types.ObjectId(actorId);
  await identity.save();
  await identityIntegration.notifyIdentityUpdate(userId, formatIdentity(identity));
  await logAudit({ userId, actorId, action: 'identity_profile_update', resource: 'identity', resourceId: identity.identityId });
  return formatIdentity(identity);
}

export async function listDocuments(userId: string, documentType?: DocumentType) {
  await assertIdentityAccess(userId);
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId), deletedAt: null };
  if (documentType) filter.documentType = documentType;
  const docs = await IdentityDocument.find(filter).sort({ createdAt: -1 });
  return docs.map(formatDocument);
}

export async function addDocument(userId: string, input: {
  documentType: DocumentType;
  documentNumber: string;
  title: string;
  description?: string;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}, actorId: string) {
  await requireIdentityPermission(userId, 'documents.manage');
  const identity = await CitizenIdentity.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!identity) throw new Error('IDENTITY_NOT_FOUND');
  const doc = await IdentityDocument.create({
    documentId: documentId(),
    userId: new Types.ObjectId(userId),
    identityId: identity.identityId,
    documentType: input.documentType,
    documentNumber: input.documentNumber,
    title: input.title,
    description: input.description,
    issuedBy: input.issuedBy,
    issuedAt: input.issuedAt ? new Date(input.issuedAt) : undefined,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    metadata: input.metadata,
    createdBy: new Types.ObjectId(actorId),
  });
  await identityIntegration.notifyDocumentAdded(userId, formatDocument(doc));
  await logAudit({ userId, actorId, action: 'identity_document_add', resource: 'identity_document', resourceId: doc.documentId });
  return formatDocument(doc);
}

export async function getEmergencyInfo(userId: string) {
  await requireIdentityPermission(userId, 'emergency.view');
  const identity = await CitizenIdentity.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!identity) throw new Error('IDENTITY_NOT_FOUND');
  return identity.emergencyInfo;
}

export async function updateEmergencyInfo(userId: string, input: {
  bloodType?: string;
  allergies?: string[];
  medications?: string[];
  emergencyContacts?: { name: string; phone: string; relationship: string }[];
  medicalNotes?: string;
}, actorId: string) {
  await requireIdentityPermission(userId, 'emergency.manage');
  const identity = await CitizenIdentity.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!identity) throw new Error('IDENTITY_NOT_FOUND');
  if (input.bloodType !== undefined) identity.emergencyInfo.bloodType = input.bloodType;
  if (input.allergies) identity.emergencyInfo.allergies = input.allergies;
  if (input.medications) identity.emergencyInfo.medications = input.medications;
  if (input.emergencyContacts) identity.emergencyInfo.emergencyContacts = input.emergencyContacts;
  if (input.medicalNotes !== undefined) identity.emergencyInfo.medicalNotes = input.medicalNotes;
  identity.updatedBy = new Types.ObjectId(actorId);
  await identity.save();
  return identity.emergencyInfo;
}

export async function generateQrVerification(userId: string) {
  await requireIdentityPermission(userId, 'qr.generate');
  const identity = await CitizenIdentity.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!identity) throw new Error('IDENTITY_NOT_FOUND');
  identity.qrCode = generateQrCode(identity.identityId);
  await identity.save();
  return identityIntegration.buildQrVerificationPayload({
    identityId: identity.identityId,
    fullName: identity.fullName,
    nationalId: identity.nationalId,
    qrCode: identity.qrCode!,
  });
}

export async function verifyQr(qrCode: string) {
  const identity = await CitizenIdentity.findOne({ qrCode, deletedAt: null, status: 'verified' });
  if (!identity) throw new Error('INVALID_QR_CODE');
  await identityIntegration.notifyVerificationCompleted(identity.userId.toString(), 'qr', true);
  return {
    verified: true,
    identityId: identity.identityId,
    fullName: identity.fullName,
    nationalId: identity.nationalId,
    status: identity.status,
  };
}

export async function verifyBarcode(barcode: string) {
  const identity = await CitizenIdentity.findOne({ nationalId: barcode, deletedAt: null, status: 'verified' });
  if (!identity) throw new Error('INVALID_BARCODE');
  await identityIntegration.notifyVerificationCompleted(identity.userId.toString(), 'barcode', true);
  return {
    verified: true,
    identityId: identity.identityId,
    fullName: identity.fullName,
    nationalId: identity.nationalId,
    status: identity.status,
  };
}

export async function exportVCard(userId: string) {
  await requireIdentityPermission(userId, 'export.vcard');
  const identity = await CitizenIdentity.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!identity) throw new Error('IDENTITY_NOT_FOUND');
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${identity.fullName}`,
    `N:${identity.fullName};;;`,
    identity.phone ? `TEL:${identity.phone}` : '',
    identity.email ? `EMAIL:${identity.email}` : '',
    identity.address ? `ADR:;;${identity.address};${identity.city ?? ''};${identity.postalCode ?? ''};;` : '',
    `NOTE:National ID: ${identity.nationalId}`,
    'END:VCARD',
  ].filter(Boolean);
  return { vcard: lines.join('\n'), filename: `${identity.nationalId}.vcf` };
}

export async function searchIdentities(query: string, limit = 20) {
  const identities = await CitizenIdentity.find({
    deletedAt: null,
    status: 'verified',
    $or: [
      { fullName: { $regex: query, $options: 'i' } },
      { nationalId: { $regex: query, $options: 'i' } },
    ],
  }).limit(limit);
  return identities.map((i) => ({
    identityId: i.identityId,
    fullName: i.fullName,
    nationalId: i.nationalId,
    status: i.status,
  }));
}

function formatIdentity(i: InstanceType<typeof CitizenIdentity>) {
  return {
    identityId: i.identityId,
    status: i.status,
    role: i.role,
    fullName: i.fullName,
    nationalId: i.nationalId,
    dateOfBirth: i.dateOfBirth,
    nationality: i.nationality,
    gender: i.gender,
    photoUrl: i.photoUrl,
    address: i.address,
    city: i.city,
    postalCode: i.postalCode,
    phone: i.phone,
    email: i.email,
    verifiedAt: i.verifiedAt,
    policeStatus: i.policeStatus,
    justiceStatus: i.justiceStatus,
    hasQrCode: !!i.qrCode,
    hasNfc: !!i.nfcTagId,
  };
}

function formatDocument(d: InstanceType<typeof IdentityDocument>) {
  return {
    documentId: d.documentId,
    identityId: d.identityId,
    documentType: d.documentType,
    documentNumber: d.documentNumber,
    title: d.title,
    description: d.description,
    issuedBy: d.issuedBy,
    issuedAt: d.issuedAt,
    expiresAt: d.expiresAt,
    isVerified: d.isVerified,
    verifiedAt: d.verifiedAt,
    metadata: d.metadata,
  };
}

export { IDENTITY_APP_BUNDLE };
