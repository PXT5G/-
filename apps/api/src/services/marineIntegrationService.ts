import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { MarineAuditLog } from '../database/models/MarineAuditLog';
import { Company } from '../database/models/Company';
import { CompanyAsset } from '../database/models/CompanyAsset';
import { CompanyRevenue } from '../database/models/CompanyRevenue';
import { CompanyExpense } from '../database/models/CompanyExpense';
import { logAudit } from './auditService';
import { enqueueNotification } from './notificationBrokerService';
import { withdraw, deposit } from './businessBankService';
import { MARINE_APP_BUNDLE } from '../constants/marine';
import { searchIdentity, searchPhone, getBankIntegration, getWorldLocation } from './policeIntegrationService';
import type { IVessel } from '../database/models/Vessel';

export async function logMarineAction(params: {
  vesselId?: string;
  dealerId?: string;
  marinaId?: string;
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
    metadata: { ...params.metadata, vesselId: params.vesselId, dealerId: params.dealerId, marinaId: params.marinaId },
    ipAddress: params.ipAddress,
  });

  await MarineAuditLog.create({
    logId: `MLOG-${uuidv4().slice(0, 8).toUpperCase()}`,
    vesselId: params.vesselId,
    dealerId: params.dealerId,
    marinaId: params.marinaId,
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

export async function notifyMarineUser(userId: string, title: string, body: string, deepLink?: string) {
  try {
    await enqueueNotification({ userId, appId: MARINE_APP_BUNDLE, title, body, icon: '⚓', deepLink, actorId: userId });
  } catch { /* permission */ }
}

export function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatVessel(vessel: IVessel) {
  return {
    vesselId: vessel.vesselId,
    registrationNumber: vessel.registrationNumber,
    hullNumber: vessel.hullNumber,
    serialNumber: vessel.serialNumber,
    manufacturer: vessel.manufacturer,
    brand: vessel.brand,
    model: vessel.vesselModel,
    variant: vessel.variant,
    year: vessel.year,
    category: vessel.category,
    specs: vessel.specs,
    color: vessel.color,
    interior: vessel.interior,
    listPrice: vessel.listPrice,
    dealerPrice: vessel.dealerPrice,
    marketValue: vessel.marketValue,
    status: vessel.status,
    ownerUserId: vessel.ownerUserId?.toString(),
    companyId: vessel.companyId,
    dealerId: vessel.dealerId,
    location: vessel.location,
    currentMarinaId: vessel.currentMarinaId,
    currentDockId: vessel.currentDockId,
    currentPortId: vessel.currentPortId,
    isFeatured: vessel.isFeatured,
    isAvailable: vessel.isAvailable,
    imageIds: vessel.imageIds,
    viewCount: vessel.viewCount,
    createdAt: (vessel as unknown as { createdAt?: Date }).createdAt?.toISOString(),
  };
}

export async function syncVesselToBusinessAsset(vessel: IVessel, actorId: string) {
  if (!vessel.companyId) return null;
  const assetId = `AST-VS-${vessel.vesselId}`;
  const asset = await CompanyAsset.findOneAndUpdate(
    { assetId },
    {
      assetId,
      companyId: vessel.companyId,
      category: 'vessel',
      name: `${vessel.year} ${vessel.brand} ${vessel.vesselModel}`,
      description: `${vessel.registrationNumber} — ${vessel.category}`,
      value: vessel.marketValue || vessel.listPrice,
      metadata: {
        vesselId: vessel.vesselId,
        registrationNumber: vessel.registrationNumber,
        hullNumber: vessel.hullNumber,
        category: vessel.category,
        engineHours: vessel.specs?.engineHours,
      },
      updatedBy: new Types.ObjectId(actorId),
    },
    { upsert: true, new: true }
  );
  return asset;
}

export async function recordMarineRevenue(companyId: string, vesselId: string, amount: number, actorId: string) {
  const revenueId = `REV-MR-${uuidv4().slice(0, 8).toUpperCase()}`;
  await CompanyRevenue.create({
    revenueId,
    companyId,
    category: 'vessel_sale',
    amount,
    description: `Vessel sale revenue — ${vesselId}`,
    referenceId: vesselId,
    recordedBy: new Types.ObjectId(actorId),
  });
  await Company.findOneAndUpdate({ companyId }, { $inc: { totalRevenue: amount, netProfit: amount } });
  return revenueId;
}

export async function recordMarineExpense(
  companyId: string,
  vesselId: string,
  amount: number,
  category: string,
  actorId: string
) {
  const expenseId = `EXP-MR-${uuidv4().slice(0, 8).toUpperCase()}`;
  await CompanyExpense.create({
    expenseId,
    companyId,
    category,
    amount,
    description: `Vessel ${category} — ${vesselId}`,
    referenceId: vesselId,
    recordedBy: new Types.ObjectId(actorId),
  });
  await Company.findOneAndUpdate({ companyId }, { $inc: { totalExpenses: amount, netProfit: -amount } });
  return expenseId;
}

export async function transferMarineFunds(
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

export async function searchVesselsForPolice(query: string) {
  const { Vessel } = await import('../database/models/Vessel');
  const vessels = await Vessel.find({
    deletedAt: null,
    $or: [
      { registrationNumber: new RegExp(query, 'i') },
      { hullNumber: new RegExp(query, 'i') },
      { serialNumber: new RegExp(query, 'i') },
      { brand: new RegExp(query, 'i') },
      { vesselModel: new RegExp(query, 'i') },
      { manufacturer: new RegExp(query, 'i') },
    ],
  }).limit(20);
  return vessels.map((v) => ({
    vesselId: v.vesselId,
    registrationNumber: v.registrationNumber,
    hullNumber: v.hullNumber,
    brand: v.brand,
    model: v.vesselModel,
    manufacturer: v.manufacturer,
    year: v.year,
    category: v.category,
    ownerUserId: v.ownerUserId?.toString(),
    companyId: v.companyId,
    status: v.status,
    currentMarinaId: v.currentMarinaId,
    currentPortId: v.currentPortId,
  }));
}

export { searchIdentity, searchPhone, getBankIntegration, getWorldLocation };
