import crypto from 'crypto';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { Types } from 'mongoose';
import { Identity, IIdentity, generateNationalId, generateMembershipNumber } from '../database/models/Identity';
import { IdentityHistory } from '../database/models/IdentityHistory';
import { IdentitySettings } from '../database/models/IdentitySettings';
import { IdentityPermission } from '../database/models/IdentityPermission';
import { VerificationLog, VerificationMethod, VerificationResult } from '../database/models/VerificationLog';
import { TemporaryPass } from '../database/models/TemporaryPass';
import { TrustedDevice } from '../database/models/TrustedDevice';
import { User } from '../database/models/User';
import { notificationService, eventBusService, BANANAOS_APP_IDS } from '../platform';

const IDENTITY_APP_ID = BANANAOS_APP_IDS.IDENTITY;

export interface QrPayload {
  v: number;
  id: string;
  nationalId: string;
  username: string;
  fullName: string;
  status: string;
  verified: boolean;
  expiry: string;
  sig: string;
}

export function buildDigitalSignature(data: {
  nationalId: string;
  username: string;
  fullName: string;
  expiryDate: Date;
}): string {
  const payload = `${data.nationalId}|${data.username}|${data.fullName}|${data.expiryDate.toISOString()}`;
  return crypto.createHmac('sha256', process.env.JWT_SECRET ?? 'bananaos-identity').update(payload).digest('hex').slice(0, 32);
}

export function buildQrPayload(identity: IIdentity): string {
  const sig = buildDigitalSignature({
    nationalId: identity.nationalId,
    username: identity.username,
    fullName: identity.fullName,
    expiryDate: identity.expiryDate,
  });
  const payload: QrPayload = {
    v: 1,
    id: identity._id.toString(),
    nationalId: identity.nationalId,
    username: identity.username,
    fullName: identity.fullName,
    status: identity.status,
    verified: identity.verified,
    expiry: identity.expiryDate.toISOString(),
    sig,
  };
  return JSON.stringify(payload);
}

export function buildBarcodeValue(nationalId: string): string {
  return nationalId.replace(/-/g, '');
}

export async function logIdentityHistory(
  identityId: Types.ObjectId,
  userId: Types.ObjectId,
  action: string,
  performedBy: Types.ObjectId,
  performedByRole: string,
  field?: string,
  oldValue?: string,
  newValue?: string
): Promise<void> {
  await IdentityHistory.create({
    identityId,
    userId,
    action,
    field,
    oldValue,
    newValue,
    performedBy,
    performedByRole,
  });
}

export async function sendIdentityNotification(
  userId: string,
  title: string,
  body: string,
  priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
): Promise<void> {
  await notificationService.send({ userId, appId: IDENTITY_APP_ID, title, body, priority });
}

export function formatIdentity(identity: IIdentity, includePrivate = false) {
  const base = {
    id: identity._id.toString(),
    userId: identity.userId.toString(),
    fullName: identity.fullName,
    username: identity.username,
    nationalId: identity.nationalId,
    membershipNumber: identity.membershipNumber,
    membershipLevel: identity.membershipLevel,
    country: identity.country,
    photo: identity.photo,
    banner: identity.banner,
    biography: identity.biography,
    organization: identity.organization,
    department: identity.department,
    role: identity.role,
    emergencyContact: identity.emergencyContact,
    additionalInfo: identity.additionalInfo,
    digitalSignature: identity.digitalSignature,
    issueDate: identity.issueDate.toISOString(),
    expiryDate: identity.expiryDate.toISOString(),
    status: identity.status,
    verified: identity.verified,
    verifiedAt: identity.verifiedAt?.toISOString(),
    qrPayload: identity.qrPayload,
    barcodeValue: identity.barcodeValue,
    badges: identity.badges,
    achievements: identity.achievements,
    profileStatus: identity.profileStatus,
    createdAt: identity.createdAt.toISOString(),
    updatedAt: identity.updatedAt.toISOString(),
  };
  if (!includePrivate) {
    return base;
  }
  return base;
}

export async function createIdentityForUser(
  userId: string,
  data: {
    fullName?: string;
    username?: string;
    country?: string;
    biography?: string;
    organization?: string;
    department?: string;
    role?: string;
    emergencyContact?: { name: string; phone: string; relationship: string };
    additionalInfo?: string;
  }
): Promise<IIdentity> {
  const existing = await Identity.findOne({ userId });
  if (existing) {
    throw new Error('Identity already exists');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  let nationalId = generateNationalId();
  while (await Identity.findOne({ nationalId })) {
    nationalId = generateNationalId();
  }

  let membershipNumber = generateMembershipNumber();
  while (await Identity.findOne({ membershipNumber })) {
    membershipNumber = generateMembershipNumber();
  }

  const username = (data.username ?? user.username).toLowerCase();
  const usernameTaken = await Identity.findOne({ username });
  if (usernameTaken) {
    throw new Error('Username already taken for identity');
  }

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 5);

  const fullName = data.fullName ?? user.displayName;
  const digitalSignature = buildDigitalSignature({
    nationalId,
    username,
    fullName,
    expiryDate,
  });

  const identity = await Identity.create({
    userId,
    fullName,
    username,
    nationalId,
    membershipNumber,
    membershipLevel: 'standard',
    country: data.country ?? 'Banana Republic',
    photo: user.avatar,
    biography: data.biography,
    organization: data.organization,
    department: data.department,
    role: data.role,
    emergencyContact: data.emergencyContact,
    additionalInfo: data.additionalInfo,
    digitalSignature,
    issueDate: new Date(),
    expiryDate,
    status: 'pending',
    verified: false,
    qrPayload: '',
    barcodeValue: buildBarcodeValue(nationalId),
    badges: ['New Member'],
    achievements: [],
    profileStatus: 'active',
  });

  identity.qrPayload = buildQrPayload(identity);
  await identity.save();

  await IdentitySettings.create({
    userId,
    identityId: identity._id,
  });

  await logIdentityHistory(
    identity._id,
    identity.userId,
    'created',
    new Types.ObjectId(userId),
    'user'
  );

  await sendIdentityNotification(
    userId,
    'Identity Created',
    `Your digital identity ${nationalId} has been created and is pending verification.`,
    'normal'
  );

  return identity;
}

export async function updateIdentityForUser(
  userId: string,
  updates: Partial<{
    fullName: string;
    biography: string;
    organization: string;
    department: string;
    role: string;
    photo: string;
    banner: string;
    emergencyContact: { name: string; phone: string; relationship: string };
    additionalInfo: string;
    country: string;
  }>
): Promise<IIdentity> {
  const identity = await Identity.findOne({ userId });
  if (!identity) {
    throw new Error('Identity not found');
  }

  const trackFields = ['fullName', 'biography', 'organization', 'department', 'role', 'country'] as const;
  for (const field of trackFields) {
    if (updates[field] !== undefined && updates[field] !== identity[field]) {
      await logIdentityHistory(
        identity._id,
        identity.userId,
        'updated',
        new Types.ObjectId(userId),
        'user',
        field,
        String(identity[field] ?? ''),
        String(updates[field])
      );
    }
  }

  Object.assign(identity, updates);

  if (updates.fullName) {
    identity.digitalSignature = buildDigitalSignature({
      nationalId: identity.nationalId,
      username: identity.username,
      fullName: identity.fullName,
      expiryDate: identity.expiryDate,
    });
    identity.qrPayload = buildQrPayload(identity);
  }

  await identity.save();
  return identity;
}

export interface VerifyContext {
  verifiedBy?: string;
  verifiedByApp?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function verifyIdentityPayload(
  payload: string,
  method: VerificationMethod,
  context: VerifyContext = {}
): Promise<{
  result: VerificationResult;
  identity?: ReturnType<typeof formatIdentity>;
  message: string;
}> {
  let parsed: QrPayload;
  try {
    parsed = JSON.parse(payload) as QrPayload;
  } catch {
    return { result: 'failed', message: 'Invalid QR payload' };
  }

  const identity = await Identity.findById(parsed.id);
  if (!identity) {
    await VerificationLog.create({
      nationalId: parsed.nationalId ?? 'unknown',
      method,
      result: 'failed',
      verifiedBy: context.verifiedBy ? new Types.ObjectId(context.verifiedBy) : undefined,
      verifiedByApp: context.verifiedByApp,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { reason: 'not_found' },
    });
    return { result: 'failed', message: 'Identity not found' };
  }

  const expectedSig = buildDigitalSignature({
    nationalId: identity.nationalId,
    username: identity.username,
    fullName: identity.fullName,
    expiryDate: identity.expiryDate,
  });

  if (parsed.sig !== expectedSig || parsed.nationalId !== identity.nationalId) {
    await VerificationLog.create({
      identityId: identity._id,
      nationalId: identity.nationalId,
      method,
      result: 'failed',
      verifiedBy: context.verifiedBy ? new Types.ObjectId(context.verifiedBy) : undefined,
      verifiedByApp: context.verifiedByApp,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { reason: 'invalid_signature' },
    });
    return { result: 'failed', message: 'Invalid signature' };
  }

  if (identity.status === 'suspended') {
    await VerificationLog.create({
      identityId: identity._id,
      nationalId: identity.nationalId,
      method,
      result: 'suspended',
      verifiedBy: context.verifiedBy ? new Types.ObjectId(context.verifiedBy) : undefined,
      verifiedByApp: context.verifiedByApp,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return { result: 'suspended', message: 'Identity is suspended' };
  }

  if (new Date() > identity.expiryDate || identity.status === 'expired') {
    await VerificationLog.create({
      identityId: identity._id,
      nationalId: identity.nationalId,
      method,
      result: 'expired',
      verifiedBy: context.verifiedBy ? new Types.ObjectId(context.verifiedBy) : undefined,
      verifiedByApp: context.verifiedByApp,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return { result: 'expired', message: 'Identity has expired' };
  }

  if (!identity.verified || identity.status !== 'verified') {
    await VerificationLog.create({
      identityId: identity._id,
      nationalId: identity.nationalId,
      method,
      result: 'failed',
      verifiedBy: context.verifiedBy ? new Types.ObjectId(context.verifiedBy) : undefined,
      verifiedByApp: context.verifiedByApp,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { reason: 'not_verified' },
    });
    return { result: 'failed', message: 'Identity not yet verified' };
  }

  await VerificationLog.create({
    identityId: identity._id,
    nationalId: identity.nationalId,
    method,
    result: 'success',
    verifiedBy: context.verifiedBy ? new Types.ObjectId(context.verifiedBy) : undefined,
    verifiedByApp: context.verifiedByApp,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await sendIdentityNotification(
    identity.userId.toString(),
    'Identity Verified',
    `Your identity was verified via ${method.toUpperCase()}.`,
    'normal'
  );

  return {
    result: 'success',
    identity: formatIdentity(identity),
    message: 'Identity verified successfully',
  };
}

export async function verifyByBarcode(
  barcodeValue: string,
  context: VerifyContext = {}
): Promise<ReturnType<typeof verifyIdentityPayload>> {
  const nationalId = barcodeValue.replace(/(.{2})(.{4})(.{6})/, '$1-$2-$3');
  const identity = await Identity.findOne({
    $or: [{ barcodeValue }, { nationalId }],
  });

  if (!identity) {
    return { result: 'failed', message: 'Identity not found' };
  }

  return verifyIdentityPayload(identity.qrPayload, 'barcode', context);
}

export async function verifyByNationalId(
  nationalId: string,
  context: VerifyContext = {}
): Promise<ReturnType<typeof verifyIdentityPayload>> {
  const identity = await Identity.findOne({ nationalId });
  if (!identity) {
    return { result: 'failed', message: 'Identity not found' };
  }
  return verifyIdentityPayload(identity.qrPayload, 'api', context);
}

export async function generateQrDataUrl(qrPayload: string): Promise<string> {
  return QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
    color: { dark: '#0A0A0A', light: '#FFFFFF' },
  });
}

export async function generateIdentityPdf(identity: IIdentity): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.rect(0, 0, doc.page.width, 80).fill('#0A0A0A');
    doc.fillColor('#D4AF37').fontSize(24).text('BananaOS Identity', 50, 30);
    doc.fillColor('#FFFFFF').fontSize(10).text('Official Digital Identity Document', 50, 58);

    doc.fillColor('#0A0A0A').fontSize(18).text(identity.fullName, 50, 110);
    doc.fontSize(12).fillColor('#666666').text(`@${identity.username}`, 50, 135);

    const fields = [
      ['National ID', identity.nationalId],
      ['Membership', identity.membershipNumber],
      ['Level', identity.membershipLevel.toUpperCase()],
      ['Country', identity.country],
      ['Status', identity.status.toUpperCase()],
      ['Verified', identity.verified ? 'YES' : 'NO'],
      ['Issue Date', identity.issueDate.toLocaleDateString()],
      ['Expiry Date', identity.expiryDate.toLocaleDateString()],
      ['Organization', identity.organization ?? '—'],
      ['Department', identity.department ?? '—'],
      ['Role', identity.role ?? '—'],
    ];

    let y = 170;
    fields.forEach(([label, value]) => {
      doc.fillColor('#D4AF37').fontSize(9).text(label, 50, y);
      doc.fillColor('#0A0A0A').fontSize(11).text(String(value), 180, y);
      y += 22;
    });

    doc.rect(50, y + 10, doc.page.width - 100, 60).stroke('#D4AF37');
    doc.fillColor('#666666').fontSize(8).text('Digital Signature', 60, y + 20);
    doc.fillColor('#0A0A0A').fontSize(9).text(identity.digitalSignature ?? '', 60, y + 35, {
      width: doc.page.width - 120,
    });

    doc.fillColor('#999999').fontSize(8).text(
      'This document is issued by BananaOS Identity System. Verification: scan QR or visit identity.bananaos.app',
      50,
      doc.page.height - 60,
      { align: 'center', width: doc.page.width - 100 }
    );

    doc.end();
  });
}

export async function generateTemporaryPass(userId: string): Promise<{ code: string; expiresAt: Date }> {
  const identity = await Identity.findOne({ userId });
  if (!identity) {
    throw new Error('Identity not found');
  }

  const code = `TMP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await TemporaryPass.create({
    identityId: identity._id,
    userId,
    code,
    expiresAt,
  });

  await logIdentityHistory(
    identity._id,
    identity.userId,
    'temp_pass_generated',
    new Types.ObjectId(userId),
    'user'
  );

  return { code, expiresAt };
}

export async function grantPermission(
  userId: string,
  appId: string,
  permission: string,
  expiresAt?: Date
): Promise<void> {
  const identity = await Identity.findOne({ userId });
  if (!identity) throw new Error('Identity not found');

  await IdentityPermission.findOneAndUpdate(
    { userId, appId, permission },
    {
      identityId: identity._id,
      userId,
      appId,
      permission,
      granted: true,
      grantedAt: new Date(),
      revokedAt: undefined,
      expiresAt,
    },
    { upsert: true, new: true }
  );

  await logIdentityHistory(
    identity._id,
    identity.userId,
    'permission_granted',
    new Types.ObjectId(userId),
    'user',
    'permission',
    undefined,
    `${appId}:${permission}`
  );
}

export async function revokePermission(userId: string, appId: string, permission: string): Promise<void> {
  const identity = await Identity.findOne({ userId });
  if (!identity) throw new Error('Identity not found');

  await IdentityPermission.findOneAndUpdate(
    { userId, appId, permission },
    { granted: false, revokedAt: new Date() }
  );

  await logIdentityHistory(
    identity._id,
    identity.userId,
    'permission_revoked',
    new Types.ObjectId(userId),
    'user',
    'permission',
    `${appId}:${permission}`,
    undefined
  );
}

export async function approveIdentity(
  identityId: string,
  adminId: string
): Promise<IIdentity> {
  const identity = await Identity.findById(identityId);
  if (!identity) throw new Error('Identity not found');

  identity.status = 'verified';
  identity.verified = true;
  identity.verifiedAt = new Date();
  identity.verifiedBy = new Types.ObjectId(adminId);
  identity.membershipLevel = 'gold';
  if (!identity.badges.includes('Verified')) {
    identity.badges.push('Verified');
  }
  identity.qrPayload = buildQrPayload(identity);
  await identity.save();

  await logIdentityHistory(
    identity._id,
    identity.userId,
    'approved',
    new Types.ObjectId(adminId),
    'admin'
  );

  await sendIdentityNotification(
    identity.userId.toString(),
    'Identity Verified',
    'Your identity has been approved and is now fully verified.',
    'high'
  );

  return identity;
}

export async function rejectIdentity(identityId: string, adminId: string, reason?: string): Promise<IIdentity> {
  const identity = await Identity.findById(identityId);
  if (!identity) throw new Error('Identity not found');

  identity.status = 'rejected';
  identity.verified = false;
  await identity.save();

  await logIdentityHistory(
    identity._id,
    identity.userId,
    'rejected',
    new Types.ObjectId(adminId),
    'admin',
    'reason',
    undefined,
    reason
  );

  await sendIdentityNotification(
    identity.userId.toString(),
    'Identity Rejected',
    reason ?? 'Your identity verification was rejected. Please contact support.',
    'high'
  );

  return identity;
}

export async function suspendIdentity(identityId: string, adminId: string): Promise<IIdentity> {
  const identity = await Identity.findById(identityId);
  if (!identity) throw new Error('Identity not found');

  identity.status = 'suspended';
  identity.profileStatus = 'suspended';
  await identity.save();

  await logIdentityHistory(identity._id, identity.userId, 'suspended', new Types.ObjectId(adminId), 'admin');

  await sendIdentityNotification(
    identity.userId.toString(),
    'Identity Suspended',
    'Your identity has been suspended. Contact BananaOS support.',
    'critical'
  );

  return identity;
}

export async function reactivateIdentity(identityId: string, adminId: string): Promise<IIdentity> {
  const identity = await Identity.findById(identityId);
  if (!identity) throw new Error('Identity not found');

  identity.status = 'verified';
  identity.verified = true;
  identity.profileStatus = 'active';
  await identity.save();

  await logIdentityHistory(identity._id, identity.userId, 'reactivated', new Types.ObjectId(adminId), 'admin');

  await sendIdentityNotification(
    identity.userId.toString(),
    'Identity Reactivated',
    'Your identity has been reactivated and is now active.',
    'high'
  );

  return identity;
}

export async function getIdentityStats() {
  const [total, verified, pending, suspended, rejected, verificationsToday] = await Promise.all([
    Identity.countDocuments(),
    Identity.countDocuments({ status: 'verified' }),
    Identity.countDocuments({ status: 'pending' }),
    Identity.countDocuments({ status: 'suspended' }),
    Identity.countDocuments({ status: 'rejected' }),
    VerificationLog.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      result: 'success',
    }),
  ]);

  return { total, verified, pending, suspended, rejected, verificationsToday };
}

export async function registerTrustedDevice(
  userId: string,
  deviceId: string,
  deviceName: string,
  deviceType = 'mobile',
  ipAddress?: string
) {
  const identity = await Identity.findOne({ userId });
  if (!identity) throw new Error('Identity not found');

  return TrustedDevice.findOneAndUpdate(
    { userId, deviceId },
    {
      identityId: identity._id,
      deviceName,
      deviceType,
      ipAddress,
      lastUsedAt: new Date(),
      trusted: true,
    },
    { upsert: true, new: true }
  );
}
