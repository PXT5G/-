import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { Identity } from '../../database/models/Identity';
import { IdentitySettings } from '../../database/models/IdentitySettings';
import { IdentityPermission } from '../../database/models/IdentityPermission';
import { IdentityHistory } from '../../database/models/IdentityHistory';
import { VerificationLog } from '../../database/models/VerificationLog';
import { TrustedDevice } from '../../database/models/TrustedDevice';
import { Session } from '../../database/models/Session';
import { Notification } from '../../database/models/Notification';
import {
  createIdentityForUser,
  updateIdentityForUser,
  formatIdentity,
  verifyIdentityPayload,
  verifyByBarcode,
  verifyByNationalId,
  generateQrDataUrl,
  generateIdentityPdf,
  generateTemporaryPass,
  grantPermission,
  revokePermission,
  registerTrustedDevice,
  sendIdentityNotification,
} from '../../services/identityService';

const IDENTITY_APP_ID = 'com.bananaos.identity';

const createIdentitySchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(30).optional(),
  country: z.string().min(1).max(100).optional(),
  biography: z.string().max(500).optional(),
  organization: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
  emergencyContact: z
    .object({
      name: z.string().min(1),
      phone: z.string().min(1),
      relationship: z.string().min(1),
    })
    .optional(),
  additionalInfo: z.string().max(1000).optional(),
});

const updateIdentitySchema = createIdentitySchema.partial().extend({
  photo: z.string().url().optional(),
  banner: z.string().url().optional(),
});

const verifySchema = z.object({
  payload: z.string().optional(),
  barcode: z.string().optional(),
  nationalId: z.string().optional(),
  method: z.enum(['qr', 'barcode', 'api']).default('qr'),
  appId: z.string().optional(),
});

const settingsSchema = z.object({
  fingerprintEnabled: z.boolean().optional(),
  faceUnlockEnabled: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  notifyVerification: z.boolean().optional(),
  notifyExpiry: z.boolean().optional(),
  notifySecurity: z.boolean().optional(),
  publicProfile: z.boolean().optional(),
  showQRByDefault: z.boolean().optional(),
});

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/),
});

const permissionSchema = z.object({
  appId: z.string().min(1),
  permission: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
});

export const createIdentity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createIdentitySchema.parse(req.body);
  try {
    const identity = await createIdentityForUser(req.user!.userId, data);
    res.status(201).json({ success: true, data: formatIdentity(identity) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create identity';
    if (message.includes('already exists')) throw new AppError(409, message);
    throw new AppError(400, message);
  }
});

export const getMyIdentity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const identity = await Identity.findOne({ userId: req.user!.userId });
  if (!identity) {
    throw new AppError(404, 'Identity not found');
  }
  res.json({ success: true, data: formatIdentity(identity) });
});

export const updateMyIdentity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = updateIdentitySchema.parse(req.body);
  try {
    const identity = await updateIdentityForUser(req.user!.userId, data);
    res.json({ success: true, data: formatIdentity(identity) });
  } catch (err) {
    throw new AppError(404, err instanceof Error ? err.message : 'Update failed');
  }
});

export const getIdentityByNationalId = asyncHandler(async (req: AuthRequest, res: Response) => {
  const identity = await Identity.findOne({ nationalId: String(req.params.nationalId) });
  if (!identity) {
    throw new AppError(404, 'Identity not found');
  }

  const settings = await IdentitySettings.findOne({ userId: identity.userId });
  if (!settings?.publicProfile && identity.userId.toString() !== req.user!.userId) {
    const hasPermission = await IdentityPermission.findOne({
      userId: identity.userId,
      appId: req.headers['x-app-id'] as string ?? 'unknown',
      granted: true,
    });
    if (!hasPermission && req.user!.role !== 'admin') {
      throw new AppError(403, 'Access denied');
    }
  }

  res.json({ success: true, data: formatIdentity(identity) });
});

export const searchIdentities = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 2) {
    throw new AppError(400, 'Search query must be at least 2 characters');
  }

  const regex = new RegExp(q, 'i');
  const identities = await Identity.find({
    $or: [
      { fullName: regex },
      { username: regex },
      { nationalId: regex },
      { membershipNumber: regex },
    ],
    status: 'verified',
  })
    .limit(20)
    .select('fullName username nationalId membershipNumber membershipLevel country photo verified status');

  res.json({
    success: true,
    data: identities.map((i) => ({
      id: i._id.toString(),
      fullName: i.fullName,
      username: i.username,
      nationalId: i.nationalId,
      membershipNumber: i.membershipNumber,
      membershipLevel: i.membershipLevel,
      country: i.country,
      photo: i.photo,
      verified: i.verified,
      status: i.status,
    })),
  });
});

export const verifyIdentity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = verifySchema.parse(req.body);
  const context = {
    verifiedBy: req.user?.userId,
    verifiedByApp: data.appId ?? (req.headers['x-app-id'] as string),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };

  let result;
  if (data.method === 'barcode' && data.barcode) {
    result = await verifyByBarcode(data.barcode, context);
  } else if (data.method === 'api' && data.nationalId) {
    result = await verifyByNationalId(data.nationalId, context);
  } else if (data.payload) {
    result = await verifyIdentityPayload(data.payload, data.method, context);
  } else {
    throw new AppError(400, 'Verification payload required');
  }

  res.json({ success: result.result === 'success', data: result });
});

export const downloadPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  const identity = await Identity.findOne({ userId: req.user!.userId });
  if (!identity) throw new AppError(404, 'Identity not found');

  const pdf = await generateIdentityPdf(identity);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="bananaos-identity-${identity.nationalId}.pdf"`);
  res.send(pdf);
});

export const generateQr = asyncHandler(async (req: AuthRequest, res: Response) => {
  const identity = await Identity.findOne({ userId: req.user!.userId });
  if (!identity) throw new AppError(404, 'Identity not found');

  const dataUrl = await generateQrDataUrl(identity.qrPayload);
  res.json({
    success: true,
    data: {
      qrPayload: identity.qrPayload,
      dataUrl,
      barcodeValue: identity.barcodeValue,
    },
  });
});

export const getPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const permissions = await IdentityPermission.find({ userId: req.user!.userId });
  res.json({
    success: true,
    data: permissions.map((p) => ({
      id: p._id.toString(),
      appId: p.appId,
      permission: p.permission,
      granted: p.granted,
      grantedAt: p.grantedAt?.toISOString(),
      revokedAt: p.revokedAt?.toISOString(),
      expiresAt: p.expiresAt?.toISOString(),
    })),
  });
});

export const addPermission = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = permissionSchema.parse(req.body);
  await grantPermission(
    req.user!.userId,
    data.appId,
    data.permission,
    data.expiresAt ? new Date(data.expiresAt) : undefined
  );
  res.status(201).json({ success: true, message: 'Permission granted' });
});

export const removePermission = asyncHandler(async (req: AuthRequest, res: Response) => {
  await revokePermission(req.user!.userId, String(req.params.appId), String(req.params.permission));
  res.json({ success: true, message: 'Permission revoked' });
});

export const getSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sessions = await Session.find({ userId: req.user!.userId }).sort({ lastActiveAt: -1 });
  res.json({
    success: true,
    data: sessions.map((s, index) => ({
      id: s._id.toString(),
      deviceId: s.deviceId,
      deviceName: s.deviceName,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      lastActiveAt: s.lastActiveAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      current: index === 0,
    })),
  });
});

export const revokeSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const session = await Session.findOne({ _id: String(req.params.sessionId), userId: req.user!.userId });
  if (!session) throw new AppError(404, 'Session not found');
  await session.deleteOne();
  await sendIdentityNotification(req.user!.userId, 'Session Revoked', 'A device session was revoked.', 'high');
  res.json({ success: true, message: 'Session revoked' });
});

export const getSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await IdentitySettings.findOne({ userId: req.user!.userId });
  if (!settings) throw new AppError(404, 'Settings not found');
  res.json({
    success: true,
    data: {
      pinEnabled: settings.pinEnabled,
      twoFactorEnabled: settings.twoFactorEnabled,
      fingerprintEnabled: settings.fingerprintEnabled,
      faceUnlockEnabled: settings.faceUnlockEnabled,
      notifyVerification: settings.notifyVerification,
      notifyExpiry: settings.notifyExpiry,
      notifySecurity: settings.notifySecurity,
      publicProfile: settings.publicProfile,
      showQRByDefault: settings.showQRByDefault,
    },
  });
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = settingsSchema.parse(req.body);
  const settings = await IdentitySettings.findOneAndUpdate(
    { userId: req.user!.userId },
    data,
    { new: true }
  );
  if (!settings) throw new AppError(404, 'Settings not found');
  res.json({
    success: true,
    data: {
      pinEnabled: settings.pinEnabled,
      twoFactorEnabled: settings.twoFactorEnabled,
      fingerprintEnabled: settings.fingerprintEnabled,
      faceUnlockEnabled: settings.faceUnlockEnabled,
      notifyVerification: settings.notifyVerification,
      notifyExpiry: settings.notifyExpiry,
      notifySecurity: settings.notifySecurity,
      publicProfile: settings.publicProfile,
      showQRByDefault: settings.showQRByDefault,
    },
  });
});

export const setPin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = pinSchema.parse(req.body);
  const pinHash = await bcrypt.hash(data.pin, 10);
  await IdentitySettings.findOneAndUpdate(
    { userId: req.user!.userId },
    { pinEnabled: true, pinHash }
  );
  res.json({ success: true, message: 'PIN set successfully' });
});

export const verifyPin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = pinSchema.parse(req.body);
  const settings = await IdentitySettings.findOne({ userId: req.user!.userId }).select('+pinHash');
  if (!settings?.pinHash) throw new AppError(400, 'PIN not configured');
  const valid = await bcrypt.compare(data.pin, settings.pinHash);
  if (!valid) throw new AppError(401, 'Invalid PIN');
  res.json({ success: true, message: 'PIN verified' });
});

export const getTrustedDevices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const devices = await TrustedDevice.find({ userId: req.user!.userId }).sort({ lastUsedAt: -1 });
  res.json({
    success: true,
    data: devices.map((d) => ({
      id: d._id.toString(),
      deviceId: d.deviceId,
      deviceName: d.deviceName,
      deviceType: d.deviceType,
      lastUsedAt: d.lastUsedAt.toISOString(),
      trusted: d.trusted,
      ipAddress: d.ipAddress,
    })),
  });
});

export const addTrustedDevice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    deviceId: z.string().min(1),
    deviceName: z.string().min(1),
    deviceType: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const device = await registerTrustedDevice(
    req.user!.userId,
    data.deviceId,
    data.deviceName,
    data.deviceType,
    req.ip
  );
  res.status(201).json({
    success: true,
    data: {
      id: device!._id.toString(),
      deviceId: device!.deviceId,
      deviceName: device!.deviceName,
      deviceType: device!.deviceType,
      trusted: device!.trusted,
    },
  });
});

export const removeTrustedDevice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const device = await TrustedDevice.findOne({ _id: String(req.params.deviceId), userId: req.user!.userId });
  if (!device) throw new AppError(404, 'Device not found');
  await device.deleteOne();
  res.json({ success: true, message: 'Device removed' });
});

export const getVerificationHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const identity = await Identity.findOne({ userId: req.user!.userId });
  if (!identity) throw new AppError(404, 'Identity not found');

  const logs = await VerificationLog.find({ identityId: identity._id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    data: logs.map((l) => ({
      id: l._id.toString(),
      method: l.method,
      result: l.result,
      verifiedByApp: l.verifiedByApp,
      createdAt: l.createdAt.toISOString(),
    })),
  });
});

export const getIdentityHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const identity = await Identity.findOne({ userId: req.user!.userId });
  if (!identity) throw new AppError(404, 'Identity not found');

  const history = await IdentityHistory.find({ identityId: identity._id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    data: history.map((h) => ({
      id: h._id.toString(),
      action: h.action,
      field: h.field,
      oldValue: h.oldValue,
      newValue: h.newValue,
      performedByRole: h.performedByRole,
      createdAt: h.createdAt.toISOString(),
    })),
  });
});

export const createTempPass = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pass = await generateTemporaryPass(req.user!.userId);
  res.status(201).json({
    success: true,
    data: {
      code: pass.code,
      expiresAt: pass.expiresAt.toISOString(),
    },
  });
});

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notifications = await Notification.find({ userId: req.user!.userId, appId: IDENTITY_APP_ID })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    data: notifications.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      body: n.body,
      icon: n.icon,
      priority: n.priority,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  });
});

export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const identity = await Identity.findOne({ userId: req.user!.userId });
  if (!identity) throw new AppError(404, 'Identity not found');

  const [verifications, permissions, devices, historyCount] = await Promise.all([
    VerificationLog.countDocuments({ identityId: identity._id, result: 'success' }),
    IdentityPermission.countDocuments({ userId: req.user!.userId, granted: true }),
    TrustedDevice.countDocuments({ userId: req.user!.userId, trusted: true }),
    IdentityHistory.countDocuments({ identityId: identity._id }),
  ]);

  const daysUntilExpiry = Math.ceil(
    (identity.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  res.json({
    success: true,
    data: {
      verifications,
      permissions,
      trustedDevices: devices,
      historyEvents: historyCount,
      daysUntilExpiry,
      membershipLevel: identity.membershipLevel,
      badges: identity.badges.length,
      achievements: identity.achievements.length,
    },
  });
});

export const shareIdentity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const identity = await Identity.findOne({ userId: req.user!.userId });
  if (!identity) throw new AppError(404, 'Identity not found');

  res.json({
    success: true,
    data: {
      shareText: `BananaOS Identity: ${identity.fullName} (${identity.nationalId}) — Verified Digital ID`,
      shareUrl: `bananaos://identity/${identity.nationalId}`,
      nationalId: identity.nationalId,
      qrPayload: identity.qrPayload,
    },
  });
});

export const getSecurityLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const identity = await Identity.findOne({ userId: req.user!.userId });
  if (!identity) throw new AppError(404, 'Identity not found');

  const [history, verifications] = await Promise.all([
    IdentityHistory.find({
      identityId: identity._id,
      action: { $in: ['suspended', 'reactivated', 'permission_granted', 'permission_revoked', 'temp_pass_generated'] },
    })
      .sort({ createdAt: -1 })
      .limit(25),
    VerificationLog.find({ identityId: identity._id })
      .sort({ createdAt: -1 })
      .limit(25),
  ]);

  const logs = [
    ...history.map((h) => ({
      type: 'history' as const,
      action: h.action,
      detail: h.newValue ?? h.field,
      createdAt: h.createdAt.toISOString(),
    })),
    ...verifications.map((v) => ({
      type: 'verification' as const,
      action: v.result,
      detail: `${v.method} via ${v.verifiedByApp ?? 'unknown'}`,
      createdAt: v.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, data: logs.slice(0, 50) });
});
