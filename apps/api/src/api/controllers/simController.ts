import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { SIMProfile } from '../../database/models/SIMProfile';
import { PhoneNumber } from '../../database/models/PhoneNumber';
import { CallSettings } from '../../database/models/CallSettings';
import { SMSSettings } from '../../database/models/SMSSettings';
import { NetworkSettings } from '../../database/models/NetworkSettings';
import { BlockedNumber } from '../../database/models/BlockedNumber';
import { Voicemail } from '../../database/models/Voicemail';
import { SIMSecuritySettings } from '../../database/models/SIMSecuritySettings';
import { SIMAuditLog } from '../../database/models/SIMAuditLog';
import { SIMPermission } from '../../database/models/SIMPermission';
import { Carrier } from '../../database/models/Carrier';
import { Identity } from '../../database/models/Identity';
import { Notification } from '../../database/models/Notification';
import {
  provisionSIM,
  getDashboard,
  activateSIM,
  deactivateSIM,
  suspendSIM,
  replaceSIM,
  changeNumber,
  reserveNumber,
  releaseNumber,
  runNetworkDiagnostic,
  formatPhoneNumber,
  formatSIMProfile,
  generateUniqueNumber,
  hasPermission,
  grantDefaultPermissions,
  logSimAudit,
  setSimPin,
  verifySimPin,
  AuditContext,
} from '../../services/simService';
import type { SIMPermissionName } from '../../database/models/SIMPermission';

const SIM_APP_ID = 'com.bananaos.sim';

function auditCtx(req: AuthRequest, permission: SIMPermissionName, reason?: string): AuditContext {
  return {
    performedBy: req.user!.userId,
    performedByRole: req.user!.role,
    permission,
    ipAddress: req.ip,
    deviceId: req.headers['x-device-id'] as string | undefined,
    reason,
  };
}

async function checkPerm(req: AuthRequest, permission: SIMPermissionName): Promise<void> {
  const allowed = await hasPermission(req.user!.userId, permission, req.user!.role);
  if (!allowed) throw new AppError(403, `Permission denied: ${permission}`);
}

export const provision = asyncHandler(async (req: AuthRequest, res: Response) => {
  const identity = await Identity.findOne({ userId: req.user!.userId });
  if (!identity?.verified) throw new AppError(403, 'Verified identity required');
  try {
    const sim = await provisionSIM(req.user!.userId, auditCtx(req, 'activate'));
    const phoneNumber = await PhoneNumber.findById(sim.phoneNumberId);
    const carrier = await Carrier.findById(sim.carrierId);
    res.status(201).json({
      success: true,
      data: formatSIMProfile(sim, phoneNumber ?? undefined, carrier ? { name: carrier.name, code: carrier.code } : undefined),
    });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Provisioning failed');
  }
});

export const getDashboardData = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_sim');
  let dashboard = await getDashboard(req.user!.userId);
  if (!dashboard) {
    const identity = await Identity.findOne({ userId: req.user!.userId, status: 'verified', verified: true });
    if (identity) {
      await provisionSIM(req.user!.userId, auditCtx(req, 'activate'));
      dashboard = await getDashboard(req.user!.userId);
    }
  }
  if (!dashboard) throw new AppError(404, 'SIM not provisioned');
  res.json({ success: true, data: dashboard });
});

export const getProfiles = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_sim');
  const sims = await SIMProfile.find({ userId: req.user!.userId });
  const result = await Promise.all(
    sims.map(async (sim) => {
      const [phoneNumber, carrier] = await Promise.all([
        PhoneNumber.findById(sim.phoneNumberId),
        Carrier.findById(sim.carrierId),
      ]);
      return formatSIMProfile(sim, phoneNumber ?? undefined, carrier ? { name: carrier.name, code: carrier.code } : undefined);
    })
  );
  res.json({ success: true, data: result });
});

export const activate = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const sim = await activateSIM(req.user!.userId, String(req.params.id), auditCtx(req, 'activate'));
    res.json({ success: true, data: { id: sim._id.toString(), status: sim.status } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Activation failed');
  }
});

export const deactivate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ reason: z.string().optional() });
  const { reason } = schema.parse(req.body);
  try {
    const sim = await deactivateSIM(req.user!.userId, String(req.params.id), auditCtx(req, 'deactivate', reason));
    res.json({ success: true, data: { id: sim._id.toString(), status: sim.status } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Deactivation failed');
  }
});

export const suspend = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ reason: z.string().optional() });
  const { reason } = schema.parse(req.body);
  try {
    const sim = await suspendSIM(req.user!.userId, String(req.params.id), auditCtx(req, 'suspend', reason));
    res.json({ success: true, data: { id: sim._id.toString(), status: sim.status } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Suspend failed');
  }
});

export const replace = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ reason: z.string().optional() });
  const { reason } = schema.parse(req.body);
  try {
    const sim = await replaceSIM(req.user!.userId, String(req.params.id), auditCtx(req, 'replace', reason));
    res.json({ success: true, data: { id: sim._id.toString(), simSerial: sim.simSerial } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Replace failed');
  }
});

export const generateNumber = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'generate_numbers');
  const schema = z.object({ premium: z.boolean().optional() });
  const { premium } = schema.parse(req.body);
  const number = await generateUniqueNumber(premium ?? false);
  await logSimAudit(req.user!.userId, 'number_generated', 'PhoneNumber', auditCtx(req, 'generate_numbers'), number._id.toString(), undefined, number.number);
  res.status(201).json({ success: true, data: formatPhoneNumber(number) });
});

export const reserveNumberHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ premium: z.boolean().optional() });
  const { premium } = schema.parse(req.body);
  try {
    const number = await reserveNumber(req.user!.userId, premium ?? false, auditCtx(req, 'reserve_number'));
    res.status(201).json({ success: true, data: formatPhoneNumber(number) });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Reserve failed');
  }
});

export const changeNumberHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ newNumberId: z.string(), reason: z.string().optional() });
  const data = schema.parse(req.body);
  try {
    const sim = await changeNumber(req.user!.userId, String(req.params.id), data.newNumberId, auditCtx(req, 'change_number', data.reason));
    res.json({ success: true, data: { id: sim._id.toString() } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Change number failed');
  }
});

export const releaseNumberHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ reason: z.string().optional() });
  const { reason } = schema.parse(req.body);
  try {
    await releaseNumber(req.user!.userId, String(req.params.id), auditCtx(req, 'release_number', reason));
    res.json({ success: true, message: 'Number released' });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Release failed');
  }
});

export const getMyNumbers = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_sim');
  const numbers = await PhoneNumber.find({
    $or: [{ userId: req.user!.userId }, { status: 'available' }],
  }).limit(50);
  res.json({ success: true, data: numbers.map(formatPhoneNumber) });
});

export const getNumberHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_sim');
  const logs = await SIMAuditLog.find({
    userId: req.user!.userId,
    action: { $in: ['number_changed', 'number_reserved', 'number_released', 'number_generated'] },
  }).sort({ createdAt: -1 }).limit(30);
  res.json({
    success: true,
    data: logs.map((l) => ({
      id: l._id.toString(),
      action: l.action,
      oldValue: l.oldValue,
      newValue: l.newValue,
      createdAt: l.createdAt.toISOString(),
    })),
  });
});

export const toggleFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'edit_sim');
  const number = await PhoneNumber.findOne({ _id: String(req.params.id), userId: req.user!.userId });
  if (!number) throw new AppError(404, 'Number not found');
  number.isFavorite = !number.isFavorite;
  await number.save();
  res.json({ success: true, data: formatPhoneNumber(number) });
});

export const getCallSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_sim');
  const settings = await CallSettings.findOne({ userId: req.user!.userId });
  if (!settings) throw new AppError(404, 'Call settings not found');
  res.json({ success: true, data: settings });
});

export const updateCallSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'edit_sim');
  const schema = z.object({
    callerIdEnabled: z.boolean().optional(),
    callWaiting: z.boolean().optional(),
    callForwarding: z.boolean().optional(),
    callForwardingNumber: z.string().optional(),
    voicemailEnabled: z.boolean().optional(),
    spamProtection: z.boolean().optional(),
    unknownCallFilter: z.boolean().optional(),
  });
  const old = await CallSettings.findOne({ userId: req.user!.userId });
  const settings = await CallSettings.findOneAndUpdate({ userId: req.user!.userId }, schema.parse(req.body), { new: true });
  await logSimAudit(req.user!.userId, 'call_settings_updated', 'CallSettings', auditCtx(req, 'edit_sim'), settings!._id.toString(), JSON.stringify(old), JSON.stringify(settings));
  res.json({ success: true, data: settings });
});

export const getSMSSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_sim');
  const settings = await SMSSettings.findOne({ userId: req.user!.userId });
  if (!settings) throw new AppError(404, 'SMS settings not found');
  res.json({ success: true, data: settings });
});

export const updateSMSSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'edit_sim');
  const schema = z.object({
    deliveryReports: z.boolean().optional(),
    readReports: z.boolean().optional(),
    spamFilter: z.boolean().optional(),
    backupEnabled: z.boolean().optional(),
  });
  const settings = await SMSSettings.findOneAndUpdate({ userId: req.user!.userId }, schema.parse(req.body), { new: true });
  await logSimAudit(req.user!.userId, 'sms_settings_updated', 'SMSSettings', auditCtx(req, 'edit_sim'));
  res.json({ success: true, data: settings });
});

export const backupSMS = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'edit_sim');
  await SMSSettings.findOneAndUpdate({ userId: req.user!.userId }, { backupEnabled: true, lastBackupAt: new Date() });
  await logSimAudit(req.user!.userId, 'sms_backup', 'SMSSettings', auditCtx(req, 'edit_sim'));
  res.json({ success: true, message: 'SMS backup completed', data: { backedUpAt: new Date().toISOString() } });
});

export const getNetwork = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_sim');
  const network = await NetworkSettings.findOne({ userId: req.user!.userId });
  if (!network) throw new AppError(404, 'Network settings not found');
  const carrier = await Carrier.findById(network.carrierId);
  res.json({
    success: true,
    data: {
      networkMode: network.networkMode,
      wifiCalling: network.wifiCalling,
      roaming: network.roaming,
      internetStatus: network.internetStatus,
      signalStrength: network.signalStrength,
      signalBars: network.signalBars,
      coverage: network.coverage,
      carrier: carrier ? { name: carrier.name, code: carrier.code } : null,
      lastDiagnosticAt: network.lastDiagnosticAt?.toISOString(),
    },
  });
});

export const updateNetwork = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'edit_sim');
  const schema = z.object({
    networkMode: z.enum(['4G', '5G', 'LTE', 'auto']).optional(),
    wifiCalling: z.boolean().optional(),
    roaming: z.boolean().optional(),
  });
  const network = await NetworkSettings.findOneAndUpdate({ userId: req.user!.userId }, schema.parse(req.body), { new: true });
  res.json({ success: true, data: network });
});

export const runDiagnostic = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_sim');
  const network = await runNetworkDiagnostic(req.user!.userId);
  res.json({
    success: true,
    data: {
      signalStrength: network.signalStrength,
      signalBars: network.signalBars,
      internetStatus: network.internetStatus,
      lastDiagnosticAt: network.lastDiagnosticAt?.toISOString(),
    },
  });
});

export const getBlockedNumbers = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_sim');
  const blocked = await BlockedNumber.find({ userId: req.user!.userId });
  res.json({ success: true, data: blocked });
});

export const addBlockedNumber = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'edit_sim');
  const schema = z.object({ number: z.string(), blockType: z.enum(['call', 'sms', 'both']).optional(), reason: z.string().optional() });
  const data = schema.parse(req.body);
  const blocked = await BlockedNumber.create({
    userId: req.user!.userId,
    number: data.number,
    blockType: data.blockType ?? 'both',
    reason: data.reason,
  });
  await logSimAudit(req.user!.userId, 'number_blocked', 'BlockedNumber', auditCtx(req, 'edit_sim'), blocked._id.toString(), undefined, data.number);
  res.status(201).json({ success: true, data: blocked });
});

export const removeBlockedNumber = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'edit_sim');
  await BlockedNumber.deleteOne({ _id: String(req.params.id), userId: req.user!.userId });
  res.json({ success: true, message: 'Unblocked' });
});

export const getVoicemail = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_sim');
  const vm = await Voicemail.findOne({ userId: req.user!.userId });
  res.json({ success: true, data: vm });
});

export const getSecurity = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_sim');
  const security = await SIMSecuritySettings.findOne({ userId: req.user!.userId });
  res.json({
    success: true,
    data: {
      simPinEnabled: security?.simPinEnabled ?? false,
      simLocked: security?.simLocked ?? false,
      biometricEnabled: security?.biometricEnabled ?? false,
      trustedDevices: security?.trustedDevices ?? [],
    },
  });
});

export const updateSecurity = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'edit_sim');
  const schema = z.object({ biometricEnabled: z.boolean().optional(), simLocked: z.boolean().optional() });
  const security = await SIMSecuritySettings.findOneAndUpdate({ userId: req.user!.userId }, schema.parse(req.body), { new: true });
  res.json({ success: true, data: security });
});

export const setPin = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'edit_sim');
  const schema = z.object({ pin: z.string().regex(/^\d{4,8}$/) });
  const { pin } = schema.parse(req.body);
  await setSimPin(req.user!.userId, pin);
  await logSimAudit(req.user!.userId, 'sim_pin_set', 'SIMSecuritySettings', auditCtx(req, 'edit_sim'));
  res.json({ success: true, message: 'SIM PIN set' });
});

export const verifyPin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ pin: z.string().regex(/^\d{4,8}$/) });
  const { pin } = schema.parse(req.body);
  const valid = await verifySimPin(req.user!.userId, pin);
  if (!valid) throw new AppError(401, 'Invalid SIM PIN');
  res.json({ success: true, message: 'PIN verified' });
});

export const getPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const perms = await SIMPermission.find({ userId: req.user!.userId, granted: true });
  res.json({ success: true, data: perms.map((p) => p.permission) });
});

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notifications = await Notification.find({ userId: req.user!.userId, appId: SIM_APP_ID })
    .sort({ createdAt: -1 }).limit(50);
  res.json({
    success: true,
    data: notifications.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      body: n.body,
      priority: n.priority,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  });
});

export const getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_audit_logs');
  const logs = await SIMAuditLog.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).limit(50);
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
      createdAt: l.createdAt.toISOString(),
    })),
  });
});

// Public API for other apps (Phone, SMS, etc.)
export const lookupNumber = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_sim');
  const number = await PhoneNumber.findOne({ number: String(req.params.number), status: 'assigned' });
  if (!number) throw new AppError(404, 'Number not found');
  const sim = number.simProfileId ? await SIMProfile.findById(number.simProfileId) : null;
  res.json({
    success: true,
    data: {
      number: number.number,
      status: number.status,
      simActive: sim?.status === 'active',
      userId: number.userId?.toString(),
    },
  });
});

export const getCarrierStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_sim');
  const sim = await SIMProfile.findOne({ userId: req.user!.userId, isPrimary: true });
  if (!sim) throw new AppError(404, 'No SIM profile');
  const carrier = await Carrier.findById(sim.carrierId);
  res.json({ success: true, data: { carrier, simStatus: sim.status } });
});

export const getSignalStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_sim');
  const network = await NetworkSettings.findOne({ userId: req.user!.userId });
  res.json({
    success: true,
    data: {
      signalStrength: network?.signalStrength ?? 'good',
      signalBars: network?.signalBars ?? 4,
      networkMode: network?.networkMode ?? '5G',
    },
  });
});

// Initialize permissions on first access
export const initPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const existing = await SIMPermission.countDocuments({ userId: req.user!.userId });
  if (existing === 0) {
    await grantDefaultPermissions(req.user!.userId, req.user!.userId);
  }
  const perms = await SIMPermission.find({ userId: req.user!.userId, granted: true });
  res.json({ success: true, data: perms.map((p) => p.permission) });
});
