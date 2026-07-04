import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { AircraftAuditLog } from '../database/models/AircraftAuditLog';
import { Company } from '../database/models/Company';
import { CompanyAsset } from '../database/models/CompanyAsset';
import { CompanyRevenue } from '../database/models/CompanyRevenue';
import { CompanyExpense } from '../database/models/CompanyExpense';
import { logAudit } from './auditService';
import { enqueueNotification } from './notificationBrokerService';
import { withdraw, deposit } from './businessBankService';
import { AVIATION_APP_BUNDLE } from '../constants/aviation';
import { searchIdentity, searchPhone, getBankIntegration, getWorldLocation } from './policeIntegrationService';
import type { IAircraft } from '../database/models/Aircraft';

export async function logAviationAction(params: {
  aircraftId?: string;
  dealerId?: string;
  airportId?: string;
  userId: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  deviceUuid?: string;
  signatureHash?: string;
}) {
  await logAudit({
    userId: params.userId,
    actorId: params.actorId,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    metadata: { ...params.metadata, aircraftId: params.aircraftId, dealerId: params.dealerId, airportId: params.airportId },
    ipAddress: params.ipAddress,
  });

  await AircraftAuditLog.create({
    logId: `ALOG-${uuidv4().slice(0, 8).toUpperCase()}`,
    aircraftId: params.aircraftId,
    dealerId: params.dealerId,
    airportId: params.airportId,
    userId: new Types.ObjectId(params.userId),
    actorId: new Types.ObjectId(params.actorId),
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    metadata: params.metadata,
    ipAddress: params.ipAddress,
    deviceUuid: params.deviceUuid,
    signatureHash: params.signatureHash,
  });
}

export async function notifyAviationUser(userId: string, title: string, body: string, deepLink?: string) {
  try {
    await enqueueNotification({ userId, appId: AVIATION_APP_BUNDLE, title, body, icon: '✈️', deepLink, actorId: userId });
  } catch { /* permission */ }
}

export function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatAircraft(aircraft: IAircraft) {
  return {
    aircraftId: aircraft.aircraftId,
    registrationNumber: aircraft.registrationNumber,
    serialNumber: aircraft.serialNumber,
    manufacturer: aircraft.manufacturer,
    brand: aircraft.brand,
    model: aircraft.aircraftModel,
    variant: aircraft.variant,
    year: aircraft.year,
    category: aircraft.category,
    flightHours: aircraft.flightHours,
    specs: aircraft.specs,
    color: aircraft.color,
    interior: aircraft.interior,
    listPrice: aircraft.listPrice,
    dealerPrice: aircraft.dealerPrice,
    marketValue: aircraft.marketValue,
    status: aircraft.status,
    ownerUserId: aircraft.ownerUserId?.toString(),
    companyId: aircraft.companyId,
    dealerId: aircraft.dealerId,
    location: aircraft.location,
    currentAirportId: aircraft.currentAirportId,
    currentHangarId: aircraft.currentHangarId,
    isFeatured: aircraft.isFeatured,
    isAvailable: aircraft.isAvailable,
    imageIds: aircraft.imageIds,
    viewCount: aircraft.viewCount,
    createdAt: (aircraft as unknown as { createdAt?: Date }).createdAt?.toISOString(),
  };
}

export async function syncAircraftToBusinessAsset(aircraft: IAircraft, actorId: string) {
  if (!aircraft.companyId) return null;
  const assetId = `AST-AC-${aircraft.aircraftId}`;
  const asset = await CompanyAsset.findOneAndUpdate(
    { assetId },
    {
      assetId,
      companyId: aircraft.companyId,
      category: 'aircraft',
      name: `${aircraft.year} ${aircraft.brand} ${aircraft.aircraftModel}`,
      description: `${aircraft.registrationNumber} — ${aircraft.category}`,
      value: aircraft.marketValue || aircraft.listPrice,
      metadata: {
        aircraftId: aircraft.aircraftId,
        registrationNumber: aircraft.registrationNumber,
        category: aircraft.category,
        flightHours: aircraft.flightHours,
      },
      updatedBy: new Types.ObjectId(actorId),
    },
    { upsert: true, new: true }
  );
  return asset;
}

export async function recordAircraftRevenue(companyId: string, aircraftId: string, amount: number, actorId: string) {
  const revenueId = `REV-AC-${uuidv4().slice(0, 8).toUpperCase()}`;
  await CompanyRevenue.create({
    revenueId,
    companyId,
    category: 'aircraft_sale',
    amount,
    description: `Aircraft sale revenue — ${aircraftId}`,
    referenceId: aircraftId,
    recordedBy: new Types.ObjectId(actorId),
  });
  await Company.findOneAndUpdate({ companyId }, { $inc: { totalRevenue: amount, netProfit: amount } });
  return revenueId;
}

export async function recordAircraftExpense(
  companyId: string,
  aircraftId: string,
  amount: number,
  category: string,
  actorId: string
) {
  const expenseId = `EXP-AC-${uuidv4().slice(0, 8).toUpperCase()}`;
  await CompanyExpense.create({
    expenseId,
    companyId,
    category,
    amount,
    description: `Aircraft ${category} — ${aircraftId}`,
    referenceId: aircraftId,
    recordedBy: new Types.ObjectId(actorId),
  });
  await Company.findOneAndUpdate({ companyId }, { $inc: { totalExpenses: amount, netProfit: -amount } });
  return expenseId;
}

export async function transferAircraftFunds(
  fromCompanyId: string | undefined,
  toCompanyId: string | undefined,
  amount: number,
  description: string,
  reference: string
) {
  if (fromCompanyId) await withdraw(fromCompanyId, amount, description, 'main', reference);
  if (toCompanyId) await deposit(toCompanyId, amount, description, 'main', reference);
  return { transferred: amount, reference };
}

export async function searchAircraftForPolice(query: string) {
  const { Aircraft } = await import('../database/models/Aircraft');
  const aircraft = await Aircraft.find({
    deletedAt: null,
    $or: [
      { registrationNumber: new RegExp(query, 'i') },
      { serialNumber: new RegExp(query, 'i') },
      { brand: new RegExp(query, 'i') },
      { aircraftModel: new RegExp(query, 'i') },
      { manufacturer: new RegExp(query, 'i') },
    ],
  }).limit(20);
  return aircraft.map((a) => ({
    aircraftId: a.aircraftId,
    registrationNumber: a.registrationNumber,
    serialNumber: a.serialNumber,
    brand: a.brand,
    model: a.aircraftModel,
    manufacturer: a.manufacturer,
    year: a.year,
    category: a.category,
    ownerUserId: a.ownerUserId?.toString(),
    companyId: a.companyId,
    status: a.status,
    currentAirportId: a.currentAirportId,
  }));
}

export { searchIdentity, searchPhone, getBankIntegration, getWorldLocation };
