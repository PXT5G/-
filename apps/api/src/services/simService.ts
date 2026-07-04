import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { Identity } from '../database/models/Identity';
import { Carrier } from '../database/models/Carrier';
import { PhoneNumber, IPhoneNumber, generatePhoneNumber, isPremiumNumber } from '../database/models/PhoneNumber';
import { SIMProfile, ISIMProfile, generateICCID } from '../database/models/SIMProfile';
import { Voicemail } from '../database/models/Voicemail';
import { CallSettings } from '../database/models/CallSettings';
import { SMSSettings } from '../database/models/SMSSettings';
import { NetworkSettings } from '../database/models/NetworkSettings';
import { BlockedNumber } from '../database/models/BlockedNumber';
import { SIMAuditLog } from '../database/models/SIMAuditLog';
import { SIMPermission, SIMPermissionName, USER_DEFAULT_PERMISSIONS, ADMIN_PERMISSIONS } from '../database/models/SIMPermission';
import { SIMSecuritySettings, generatePUK } from '../database/models/SIMSecuritySettings';
import { User } from '../database/models/User';
import {
  auditService,
  eventBusService,
  notificationService,
  permissionEngineService,
  BANANAOS_APP_IDS,
} from '../platform';

const SIM_APP_ID = BANANAOS_APP_IDS.SIM;
const DEFAULT_CARRIER_CODE = 'banana-mobile';

export interface AuditContext {
  performedBy: string;
  performedByRole: string;
  permission: SIMPermissionName;
  deviceId?: string;
  ipAddress?: string;
  reason?: string;
}

export async function hasPermission(
  userId: string,
  permission: SIMPermissionName,
  userRole: 'user' | 'admin'
): Promise<boolean> {
  const result = await permissionEngineService.hasPermission(SIM_APP_ID, userId, permission, userRole);
  return result.granted;
}

export async function requirePermission(
  userId: string,
  permission: SIMPermissionName,
  userRole: 'user' | 'admin'
): Promise<void> {
  const allowed = await hasPermission(userId, permission, userRole);
  if (!allowed) throw new Error(`Permission denied: ${permission}`);
}

export async function grantDefaultPermissions(userId: string, grantedBy: string): Promise<void> {
  await permissionEngineService.grantPermissions(SIM_APP_ID, userId, [...USER_DEFAULT_PERMISSIONS], grantedBy);
}

export async function grantAdminPermissions(userId: string): Promise<void> {
  await permissionEngineService.grantPermissions(SIM_APP_ID, userId, [...ADMIN_PERMISSIONS], userId);
}

export async function logSimAudit(
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
    appId: SIM_APP_ID,
    userId: targetUserId,
    action,
    entityType,
    entityId,
    ctx,
    oldValue,
    newValue,
    reason,
  });

  await SIMAuditLog.create({
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

export async function sendSimNotification(
  userId: string,
  title: string,
  body: string,
  priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
): Promise<void> {
  await notificationService.send({ userId, appId: SIM_APP_ID, title, body, priority });
}

async function ensureDefaultCarrier() {
  let carrier = await Carrier.findOne({ code: DEFAULT_CARRIER_CODE });
  if (!carrier) {
    carrier = await Carrier.create({
      name: 'Banana Mobile',
      code: DEFAULT_CARRIER_CODE,
      country: 'Banana Republic',
      mcc: '001',
      mnc: '01',
      supports5G: true,
      supportsWifiCalling: true,
      supportsRoaming: true,
    });
  }
  return carrier;
}

export function formatPhoneNumber(pn: IPhoneNumber) {
  return {
    id: pn._id.toString(),
    number: pn.number,
    userId: pn.userId?.toString(),
    simProfileId: pn.simProfileId?.toString(),
    type: pn.type,
    status: pn.status,
    isFavorite: pn.isFavorite,
    assignedAt: pn.assignedAt?.toISOString(),
    createdAt: pn.createdAt.toISOString(),
  };
}

export function formatSIMProfile(
  sim: ISIMProfile,
  phoneNumber?: IPhoneNumber,
  carrier?: { name: string; code: string }
) {
  return {
    id: sim._id.toString(),
    userId: sim.userId.toString(),
    identityId: sim.identityId.toString(),
    phoneNumber: phoneNumber?.number,
    phoneNumberId: sim.phoneNumberId.toString(),
    carrier: carrier ?? { name: 'Banana Mobile', code: DEFAULT_CARRIER_CODE },
    simType: sim.simType,
    simSerial: sim.simSerial,
    status: sim.status,
    isPrimary: sim.isPrimary,
    slot: sim.slot,
    subscriptionPlan: sim.subscriptionPlan,
    activatedAt: sim.activatedAt?.toISOString(),
    suspendedAt: sim.suspendedAt?.toISOString(),
    createdAt: sim.createdAt.toISOString(),
  };
}

export async function generateUniqueNumber(premium = false): Promise<IPhoneNumber> {
  let number = generatePhoneNumber(premium);
  let attempts = 0;
  while (await PhoneNumber.findOne({ number }) && attempts < 20) {
    number = generatePhoneNumber(premium);
    attempts++;
  }
  const type = premium || isPremiumNumber(number) ? 'premium' : 'standard';
  return PhoneNumber.create({ number, type, status: 'available' });
}

export async function provisionSIM(userId: string, ctx: AuditContext): Promise<ISIMProfile> {
  const existing = await SIMProfile.findOne({ userId, isPrimary: true });
  if (existing) return existing;

  const identity = await Identity.findOne({ userId, status: 'verified', verified: true });
  if (!identity) throw new Error('Verified identity required for SIM provisioning');

  const permCount = await SIMPermission.countDocuments({ userId });
  if (permCount > 0) {
    await requirePermission(userId, 'activate', ctx.performedByRole as 'user' | 'admin');
  }

  const carrier = await ensureDefaultCarrier();
  const phoneNumber = await generateUniqueNumber();
  phoneNumber.userId = new Types.ObjectId(userId);
  phoneNumber.status = 'assigned';
  phoneNumber.assignedAt = new Date();
  await phoneNumber.save();

  const sim = await SIMProfile.create({
    userId,
    identityId: identity._id,
    phoneNumberId: phoneNumber._id,
    carrierId: carrier._id,
    simType: 'esim',
    simSerial: generateICCID(),
    status: 'active',
    isPrimary: true,
    slot: 'primary',
    subscriptionPlan: 'standard',
    activatedAt: new Date(),
  });

  phoneNumber.simProfileId = sim._id;
  await phoneNumber.save();

  await Voicemail.create({ userId, simProfileId: sim._id });
  await CallSettings.create({ userId });
  await SMSSettings.create({ userId });
  await NetworkSettings.create({
    userId,
    simProfileId: sim._id,
    carrierId: carrier._id,
    signalStrength: 'excellent',
    signalBars: 5,
  });
  await SIMSecuritySettings.create({ userId, pukCode: generatePUK() });
  await grantDefaultPermissions(userId, ctx.performedBy);

  await logSimAudit(userId, 'sim_provisioned', 'SIMProfile', ctx, sim._id.toString(), undefined, phoneNumber.number);
  await sendSimNotification(userId, 'SIM Activated', `Your number ${phoneNumber.number} is now active on Banana Mobile.`, 'high');
  eventBusService.emitToUser(userId, 'sim:activated', { simProfileId: sim._id.toString(), phoneNumber: phoneNumber.number });

  return sim;
}

export async function getDashboard(userId: string) {
  const sim = await SIMProfile.findOne({ userId, isPrimary: true });
  if (!sim) return null;

  const [phoneNumber, carrier, network] = await Promise.all([
    PhoneNumber.findById(sim.phoneNumberId),
    Carrier.findById(sim.carrierId),
    NetworkSettings.findOne({ userId }),
  ]);

  return {
    phoneNumber: phoneNumber?.number,
    carrier: carrier ? { name: carrier.name, code: carrier.code } : null,
    simStatus: sim.status,
    subscription: sim.subscriptionPlan,
    simType: sim.simType,
    simSerial: sim.simSerial,
    signalStrength: network?.signalStrength ?? 'good',
    signalBars: network?.signalBars ?? 4,
    networkMode: network?.networkMode ?? '5G',
    internetStatus: network?.internetStatus ?? true,
    roaming: network?.roaming ?? false,
    wifiCalling: network?.wifiCalling ?? true,
    coverage: network?.coverage ?? 'National',
    simProfile: formatSIMProfile(sim, phoneNumber ?? undefined, carrier ? { name: carrier.name, code: carrier.code } : undefined),
  };
}

export async function activateSIM(userId: string, simId: string, ctx: AuditContext): Promise<ISIMProfile> {
  await requirePermission(ctx.performedBy, 'activate', ctx.performedByRole as 'user' | 'admin');
  const sim = await SIMProfile.findOne({ _id: simId, userId });
  if (!sim) throw new Error('SIM not found');
  const oldStatus = sim.status;
  sim.status = 'active';
  sim.activatedAt = new Date();
  sim.suspendedAt = undefined;
  await sim.save();
  await logSimAudit(userId, 'sim_activated', 'SIMProfile', ctx, simId, oldStatus, 'active');
  await sendSimNotification(userId, 'SIM Activated', 'Your SIM is now active.', 'normal');
  eventBusService.emitToUser(userId, 'sim:activated', { simProfileId: simId });
  return sim;
}

export async function deactivateSIM(userId: string, simId: string, ctx: AuditContext): Promise<ISIMProfile> {
  await requirePermission(ctx.performedBy, 'deactivate', ctx.performedByRole as 'user' | 'admin');
  const sim = await SIMProfile.findOne({ _id: simId, userId });
  if (!sim) throw new Error('SIM not found');
  const oldStatus = sim.status;
  sim.status = 'deactivated';
  sim.deactivatedAt = new Date();
  await sim.save();
  await logSimAudit(userId, 'sim_deactivated', 'SIMProfile', ctx, simId, oldStatus, 'deactivated', ctx.reason);
  eventBusService.emitToUser(userId, 'sim:deactivated', { simProfileId: simId });
  return sim;
}

export async function suspendSIM(userId: string, simId: string, ctx: AuditContext): Promise<ISIMProfile> {
  await requirePermission(ctx.performedBy, 'suspend', ctx.performedByRole as 'user' | 'admin');
  const sim = await SIMProfile.findOne({ _id: simId, userId });
  if (!sim) throw new Error('SIM not found');
  const oldStatus = sim.status;
  sim.status = 'suspended';
  sim.suspendedAt = new Date();
  await sim.save();
  await logSimAudit(userId, 'sim_suspended', 'SIMProfile', ctx, simId, oldStatus, 'suspended', ctx.reason);
  await sendSimNotification(userId, 'SIM Suspended', ctx.reason ?? 'Your SIM has been suspended.', 'high');
  eventBusService.emitToUser(userId, 'sim:suspended', { simProfileId: simId });
  return sim;
}

export async function replaceSIM(userId: string, simId: string, ctx: AuditContext): Promise<ISIMProfile> {
  await requirePermission(ctx.performedBy, 'replace', ctx.performedByRole as 'user' | 'admin');
  const oldSim = await SIMProfile.findOne({ _id: simId, userId });
  if (!oldSim) throw new Error('SIM not found');

  const oldSerial = oldSim.simSerial;
  oldSim.status = 'deactivated';
  oldSim.deactivatedAt = new Date();
  await oldSim.save();

  const newSim = await SIMProfile.create({
    userId,
    identityId: oldSim.identityId,
    phoneNumberId: oldSim.phoneNumberId,
    carrierId: oldSim.carrierId,
    simType: oldSim.simType,
    simSerial: generateICCID(),
    status: 'active',
    isPrimary: oldSim.isPrimary,
    slot: oldSim.slot,
    subscriptionPlan: oldSim.subscriptionPlan,
    activatedAt: new Date(),
  });

  await logSimAudit(userId, 'sim_replaced', 'SIMProfile', ctx, newSim._id.toString(), oldSerial, newSim.simSerial, ctx.reason);
  await sendSimNotification(userId, 'SIM Replaced', 'Your SIM has been replaced with a new profile.', 'high');
  eventBusService.emitToUser(userId, 'sim:replaced', { oldSimId: simId, newSimId: newSim._id.toString() });
  return newSim;
}

export async function changeNumber(userId: string, simId: string, newNumberId: string, ctx: AuditContext): Promise<ISIMProfile> {
  await requirePermission(ctx.performedBy, 'change_number', ctx.performedByRole as 'user' | 'admin');
  const sim = await SIMProfile.findOne({ _id: simId, userId });
  if (!sim) throw new Error('SIM not found');

  const newNumber = await PhoneNumber.findById(newNumberId);
  if (!newNumber || newNumber.status !== 'available' && newNumber.status !== 'reserved') {
    throw new Error('Number not available');
  }

  const oldNumber = await PhoneNumber.findById(sim.phoneNumberId);
  const oldNumStr = oldNumber?.number;

  if (oldNumber) {
    oldNumber.status = 'released';
    oldNumber.releasedAt = new Date();
    oldNumber.userId = undefined;
    oldNumber.simProfileId = undefined;
    await oldNumber.save();
  }

  newNumber.userId = new Types.ObjectId(userId);
  newNumber.simProfileId = sim._id;
  newNumber.status = 'assigned';
  newNumber.assignedAt = new Date();
  await newNumber.save();

  sim.phoneNumberId = newNumber._id;
  await sim.save();

  await logSimAudit(userId, 'number_changed', 'PhoneNumber', ctx, newNumberId, oldNumStr, newNumber.number, ctx.reason);
  await sendSimNotification(userId, 'Number Changed', `Your new number is ${newNumber.number}`, 'high');
  eventBusService.emitToUser(userId, 'sim:number:changed', { phoneNumber: newNumber.number });
  return sim;
}

export async function reserveNumber(userId: string, premium: boolean, ctx: AuditContext): Promise<IPhoneNumber> {
  await requirePermission(ctx.performedBy, 'reserve_number', ctx.performedByRole as 'user' | 'admin');
  const number = await generateUniqueNumber(premium);
  number.userId = new Types.ObjectId(userId);
  number.status = 'reserved';
  await number.save();
  await logSimAudit(userId, 'number_reserved', 'PhoneNumber', ctx, number._id.toString(), undefined, number.number);
  return number;
}

export async function releaseNumber(userId: string, numberId: string, ctx: AuditContext): Promise<void> {
  await requirePermission(ctx.performedBy, 'release_number', ctx.performedByRole as 'user' | 'admin');
  const number = await PhoneNumber.findOne({ _id: numberId, userId, status: 'reserved' });
  if (!number) throw new Error('Reserved number not found');
  const oldNum = number.number;
  number.status = 'available';
  number.userId = undefined;
  number.releasedAt = new Date();
  await number.save();
  await logSimAudit(userId, 'number_released', 'PhoneNumber', ctx, numberId, oldNum, undefined, ctx.reason);
}

export async function runNetworkDiagnostic(userId: string) {
  const network = await NetworkSettings.findOne({ userId });
  if (!network) throw new Error('Network settings not found');

  const strengths: Array<'poor' | 'fair' | 'good' | 'excellent'> = ['poor', 'fair', 'good', 'excellent'];
  const signalStrength = strengths[Math.floor(Math.random() * strengths.length)];
  const signalBars = signalStrength === 'excellent' ? 5 : signalStrength === 'good' ? 4 : signalStrength === 'fair' ? 2 : 1;

  network.signalStrength = signalStrength;
  network.signalBars = signalBars;
  network.internetStatus = signalBars >= 2;
  network.lastDiagnosticAt = new Date();
  await network.save();

  eventBusService.emitToUser(userId, 'sim:signal:updated', { signalStrength, signalBars });
  return network;
}

export async function getAdminStats() {
  const [totalSims, activeSims, suspendedSims, totalNumbers, assignedNumbers] = await Promise.all([
    SIMProfile.countDocuments(),
    SIMProfile.countDocuments({ status: 'active' }),
    SIMProfile.countDocuments({ status: 'suspended' }),
    PhoneNumber.countDocuments(),
    PhoneNumber.countDocuments({ status: 'assigned' }),
  ]);
  return { totalSims, activeSims, suspendedSims, totalNumbers, assignedNumbers, availableNumbers: totalNumbers - assignedNumbers };
}

export async function setSimPin(userId: string, pin: string): Promise<void> {
  const hash = await bcrypt.hash(pin, 10);
  await SIMSecuritySettings.findOneAndUpdate({ userId }, { simPinEnabled: true, simPinHash: hash });
}

export async function verifySimPin(userId: string, pin: string): Promise<boolean> {
  const settings = await SIMSecuritySettings.findOne({ userId }).select('+simPinHash');
  if (!settings?.simPinHash) return false;
  return bcrypt.compare(pin, settings.simPinHash);
}
