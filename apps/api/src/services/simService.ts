import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { SimCard } from '../database/models/SimCard';
import { SIM_APP_BUNDLE, SIM_SOCKET_EVENTS, type SimSlot } from '../constants/sim';
import { checkPermission } from './permissionBrokerService';
import { emitToUser } from './socketService';
import { logAudit } from './auditService';

function simId() {
  return `SIM-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function formatSim(doc: InstanceType<typeof SimCard>) {
  return {
    simId: doc.simId,
    slot: doc.slot,
    carrier: doc.carrier,
    phoneNumber: doc.phoneNumber,
    iccid: doc.iccid,
    imsi: doc.imsi,
    networkGeneration: doc.networkGeneration,
    signalStrength: doc.signalStrength,
    roaming: doc.roaming,
    isPreferredVoice: doc.isPreferredVoice,
    isPreferredData: doc.isPreferredData,
    isPreferredSms: doc.isPreferredSms,
    simLocked: doc.simLocked,
    pinEnabled: doc.pinEnabled,
    apn: doc.apn,
    dataUsedMb: doc.dataUsedMb,
    voiceMinutesUsed: doc.voiceMinutesUsed,
    smsCountUsed: doc.smsCountUsed,
  };
}

async function assertSim(userId: string) {
  const allowed = await checkPermission(userId, SIM_APP_BUNDLE, 'network');
  if (!allowed) throw new Error('SIM_PERMISSION_DENIED');
}

export async function initializeSim(userId: string, actorId: string) {
  const existing = await SimCard.countDocuments({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (existing > 0) {
    const sims = await SimCard.find({ userId: new Types.ObjectId(userId), deletedAt: null });
    return { sims: sims.map(formatSim) };
  }

  const defaults = [
    { slot: 'sim1' as SimSlot, carrier: 'Gulf Mobile', phoneNumber: '+971500000001', iccid: '8944200000000000001', isPreferredVoice: true, isPreferredData: true, isPreferredSms: true },
    { slot: 'sim2' as SimSlot, carrier: 'Gulf Business', phoneNumber: '+971500000002', iccid: '8944200000000000002', isPreferredVoice: false, isPreferredData: false, isPreferredSms: false },
  ];

  const sims = [];
  for (const d of defaults) {
    const doc = await SimCard.create({
      simId: simId(),
      userId: new Types.ObjectId(userId),
      ...d,
      networkGeneration: '5g',
      signalStrength: 5,
      createdBy: new Types.ObjectId(actorId),
    });
    sims.push(formatSim(doc));
  }

  await logAudit({ userId, actorId, action: 'sim_initialize', resource: 'sim' });
  emitToUser(userId, 'sim:status', { sims });
  return { sims };
}

export async function listSims(userId: string) {
  await assertSim(userId);
  const sims = await SimCard.find({ userId: new Types.ObjectId(userId), deletedAt: null });
  return sims.map(formatSim);
}

export async function getSim(userId: string, simIdParam: string) {
  await assertSim(userId);
  const doc = await SimCard.findOne({ simId: simIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) throw new Error('SIM_NOT_FOUND');
  return formatSim(doc);
}

export async function updateSim(
  userId: string,
  simIdParam: string,
  updates: Partial<{
    roaming: boolean;
    isPreferredVoice: boolean;
    isPreferredData: boolean;
    isPreferredSms: boolean;
    apn: string;
    pinEnabled: boolean;
    simLocked: boolean;
  }>,
  actorId: string
) {
  await assertSim(userId);
  const doc = await SimCard.findOne({ simId: simIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) throw new Error('SIM_NOT_FOUND');

  if (updates.isPreferredVoice) {
    await SimCard.updateMany({ userId: new Types.ObjectId(userId), deletedAt: null }, { isPreferredVoice: false });
  }
  if (updates.isPreferredData) {
    await SimCard.updateMany({ userId: new Types.ObjectId(userId), deletedAt: null }, { isPreferredData: false });
  }
  if (updates.isPreferredSms) {
    await SimCard.updateMany({ userId: new Types.ObjectId(userId), deletedAt: null }, { isPreferredSms: false });
  }

  Object.assign(doc, updates);
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();

  emitToUser(userId, 'sim:updated', { sim: formatSim(doc) });
  return formatSim(doc);
}

export async function refreshSimStatus(userId: string): Promise<void> {
  const sims = await SimCard.find({ userId: new Types.ObjectId(userId), deletedAt: null });
  for (const sim of sims) {
    sim.signalStrength = Math.max(1, Math.min(5, sim.signalStrength + (Math.random() > 0.5 ? 0 : -1)));
    await sim.save();
    emitToUser(userId, 'sim:status', { sim: formatSim(sim) });
  }
}

export async function refreshAllSimStatus(): Promise<void> {
  const sims = await SimCard.find({ deletedAt: null }).limit(100);
  const userIds = [...new Set(sims.map((s) => s.userId.toString()))];
  for (const uid of userIds) {
    await refreshSimStatus(uid);
  }
}

export { SIM_SOCKET_EVENTS };
