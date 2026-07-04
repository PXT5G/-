import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { User } from '../database/models/User';
import { WorldState } from '../database/models/WorldState';
import { Carrier } from '../database/models/Carrier';
import { NetworkState } from '../database/models/NetworkState';
import { PoliceCitation, type IPoliceCitation } from '../database/models/PoliceCitation';
import { PoliceWarrant } from '../database/models/PoliceWarrant';
import { PoliceReport } from '../database/models/PoliceReport';
import { PoliceWanted } from '../database/models/PoliceWanted';
import { DeviceProfile } from '../database/models/DeviceProfile';
import { logAudit } from './auditService';
import { PoliceDutyLog } from '../database/models/PoliceDutyLog';

export async function logPoliceAction(params: {
  userId: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  deviceUuid?: string;
  officerBadge?: string;
}) {
  await logAudit({
    userId: params.userId,
    actorId: params.actorId,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    metadata: { ...params.metadata, deviceUuid: params.deviceUuid, officerBadge: params.officerBadge },
    ipAddress: params.ipAddress,
  });

  if (params.officerBadge) {
    await PoliceDutyLog.create({
      logId: `LOG-${uuidv4().slice(0, 8).toUpperCase()}`,
      officerId: new Types.ObjectId(params.actorId),
      officerBadge: params.officerBadge,
      action: params.action,
      details: params.resourceId ?? params.resource,
      deviceUuid: params.deviceUuid,
      ipAddress: params.ipAddress,
      createdBy: new Types.ObjectId(params.actorId),
    });
  }
}

export async function searchIdentity(query: string) {
  const users = await User.find({
    $or: [
      { username: new RegExp(query, 'i') },
      { displayName: new RegExp(query, 'i') },
      { email: new RegExp(query, 'i') },
    ],
  }).limit(20);

  const results = await Promise.all(users.map(async (user) => {
    const profile = await DeviceProfile.findOne({ userId: user._id });
    const warrants = await PoliceWarrant.find({ subjectUserId: user._id, status: 'active', deletedAt: null }).limit(5);
    const citations = await PoliceCitation.find({ violatorUserId: user._id, deletedAt: null }).sort({ createdAt: -1 }).limit(10);
    const reports = await PoliceReport.find({ suspectNames: user.displayName, deletedAt: null }).limit(5);
    const wanted = await PoliceWanted.find({ name: new RegExp(user.displayName, 'i'), status: 'active', deletedAt: null }).limit(3);

    return {
      userId: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      governmentId: profile?.serialNumber,
      deviceUuid: profile?.deviceUuid,
      licenses: { driving: true, weapon: citations.length === 0 },
      previousArrests: reports.filter((r) => r.reportType === 'arrest').length,
      warnings: citations.filter((c) => c.citationType === 'warning').length,
      activeWarrants: warrants.map((w) => ({ warrantId: w.warrantId, charges: w.charges })),
      outstandingFines: citations.filter((c) => c.status === 'issued').reduce((s, c) => s + c.fineAmount, 0),
      wantedMatches: wanted.map((w) => ({ wantedId: w.wantedId, charges: w.charges })),
      courtHistory: reports.filter((r) => r.status === 'closed').length,
    };
  }));

  return results;
}

export async function searchPerson(query: string) {
  return searchIdentity(query);
}

export async function searchPhone(phone: string) {
  const user = await User.findOne({ username: phone.toLowerCase() });
  if (!user) return { found: false, results: [] };
  const identity = await searchIdentity(user.username);
  const carrier = await Carrier.findOne({ userId: user._id });
  const net = await NetworkState.findOne({ userId: user._id });
  const world = await WorldState.findOne({ userId: user._id });
  return {
    found: true,
    phone: user.username,
    userId: user._id.toString(),
    displayName: user.displayName,
    carrier: carrier?.name,
    signalGeneration: carrier?.generation,
    networkConnected: net?.internetConnected,
    vpnDetected: net?.vpnEnabled ?? false,
    lastLocation: world ? {
      latitude: world.latitude,
      longitude: world.longitude,
      district: world.district,
      street: world.street,
      zone: world.zone,
    } : null,
    identity: identity[0] ?? null,
  };
}

export async function searchPlate(plate: string) {
  const citations = await PoliceCitation.find({
    plateNumber: new RegExp(plate, 'i'),
    deletedAt: null,
  }).sort({ createdAt: -1 }).limit(20);

  const bolos = await (await import('../database/models/PoliceBolo')).PoliceBolo.find({
    plateNumber: new RegExp(plate, 'i'),
    status: 'active',
    deletedAt: null,
  }).limit(5);

  let marketplaceVehicles: Record<string, unknown>[] = [];
  try {
    const { searchVehiclesForPolice } = await import('./vehicleIntegrationService');
    marketplaceVehicles = await searchVehiclesForPolice(plate);
  } catch { /* vehicles module optional at boot */ }

  return {
    plate: plate.toUpperCase(),
    citations: citations.map((c) => ({
      citationId: c.citationId,
      violatorName: c.violatorName,
      violationCode: c.violationCode,
      fineAmount: c.fineAmount,
      status: c.status,
      issuedAt: c.createdAt.toISOString(),
    })),
    activeBolos: bolos.map((b) => ({
      boloId: b.boloId,
      title: b.title,
      dangerLevel: b.dangerLevel,
    })),
    marketplaceVehicles,
    flags: citations.some((c) => c.status === 'issued') ? ['outstanding_fines'] : [],
  };
}

export async function searchVehicle(query: string) {
  const plateResult = await searchPlate(query);
  try {
    const { searchVehiclesForPolice } = await import('./vehicleIntegrationService');
    const vehicles = await searchVehiclesForPolice(query);
    return { ...plateResult, vehicles };
  } catch {
    return plateResult;
  }
}

export async function searchProperty(query: string) {
  const orgs = await (await import('../database/models/PoliceOrganization')).PoliceOrganization.find({
    $or: [{ name: new RegExp(query, 'i') }, { address: new RegExp(query, 'i') }],
    deletedAt: null,
  }).limit(10);

  const orgResults = orgs.map((o) => ({
    orgId: o.orgId,
    name: o.name,
    type: o.type,
    address: o.address,
    district: o.district,
    flags: o.flags,
    source: 'organization' as const,
  }));

  try {
    const { searchPropertiesForPolice } = await import('./realEstateIntegrationService');
    const properties = await searchPropertiesForPolice(query);
    return [...properties.map((p) => ({ ...p, source: 'property' as const })), ...orgResults];
  } catch {
    return orgResults;
  }
}

export async function searchBusiness(query: string) {
  return searchProperty(query);
}

export async function searchWeaponLicense(query: string) {
  const identity = await searchIdentity(query);
  return identity.map((id) => ({
    ...id,
    weaponLicense: {
      status: id.licenses?.weapon ? 'valid' : 'none',
      restrictions: id.previousArrests > 0 ? ['background_check_required'] : [],
    },
  }));
}

export async function getBankIntegration(userId: string) {
  const citations = await PoliceCitation.find({
    violatorUserId: userId,
    deletedAt: null,
  });
  const outstanding = citations.filter((c) => c.status === 'issued');
  const paid = citations.filter((c) => c.status === 'paid');
  return {
    outstandingFines: outstanding.reduce((s, c) => s + c.fineAmount, 0),
    fines: outstanding.map((c) => ({
      citationId: c.citationId,
      amount: c.fineAmount,
      violationCode: c.violationCode,
      issuedAt: c.createdAt.toISOString(),
    })),
    paidTotal: paid.reduce((s, c) => s + c.fineAmount, 0),
    accountFrozen: outstanding.some((c) => c.fineAmount > 5000),
    courtOrders: [],
  };
}

export async function getWorldLocation(userId: string) {
  const world = await WorldState.findOne({ userId });
  if (!world) return null;
  const carrier = await Carrier.findOne({ userId });
  const net = await NetworkState.findOne({ userId });
  return {
    latitude: world.latitude,
    longitude: world.longitude,
    district: world.district,
    street: world.street,
    postalCode: world.zone,
    heading: world.heading,
    speed: world.speed,
    inVehicle: world.vehicleState === 'in_vehicle',
    signalQuality: net?.signalStrength ?? 0,
    vpnDetected: net?.vpnEnabled ?? false,
    carrier: carrier?.name,
    generation: carrier?.generation,
    lastTickAt: world.lastTickAt.toISOString(),
  };
}

export function calculateFine(violationCode: string): number {
  const fines: Record<string, number> = {
    SPEEDING: 250,
    RECKLESS: 500,
    DUI: 1500,
    PARKING: 75,
    RED_LIGHT: 200,
    NO_INSURANCE: 350,
    EXPIRED_REG: 150,
    DISTURBING_PEACE: 300,
    ASSAULT: 2000,
    THEFT: 1000,
  };
  return fines[violationCode.toUpperCase()] ?? 100;
}

export function calculateJailDays(violationCode: string): number {
  const jail: Record<string, number> = {
    DUI: 5,
    ASSAULT: 10,
    THEFT: 7,
    RECKLESS: 2,
    DISTURBING_PEACE: 1,
  };
  return jail[violationCode.toUpperCase()] ?? 0;
}
