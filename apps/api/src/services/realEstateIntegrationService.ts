import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { PropertyAuditLog } from '../database/models/PropertyAuditLog';
import { Property } from '../database/models/Property';
import { Company } from '../database/models/Company';
import { CompanyAsset } from '../database/models/CompanyAsset';
import { CompanyRevenue } from '../database/models/CompanyRevenue';
import { CompanyExpense } from '../database/models/CompanyExpense';
import { logAudit } from './auditService';
import { enqueueNotification } from './notificationBrokerService';
import { REAL_ESTATE_APP_BUNDLE } from '../constants/realEstate';
import {
  searchIdentity,
  searchPhone,
  getBankIntegration,
  getWorldLocation,
} from './policeIntegrationService';
import { withdraw, deposit } from './businessBankService';
import type { IProperty } from '../database/models/Property';

export async function logRealEstateAction(params: {
  propertyId?: string;
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
    metadata: { ...params.metadata, propertyId: params.propertyId, deviceUuid: params.deviceUuid },
    ipAddress: params.ipAddress,
  });

  await PropertyAuditLog.create({
    logId: `RELOG-${uuidv4().slice(0, 8).toUpperCase()}`,
    propertyId: params.propertyId,
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

export async function notifyRealEstateUser(userId: string, title: string, body: string, deepLink?: string) {
  try {
    await enqueueNotification({
      userId,
      appId: REAL_ESTATE_APP_BUNDLE,
      title,
      body,
      icon: '🏠',
      deepLink,
      actorId: userId,
    });
  } catch {
    // notification permission may not be granted
  }
}

export function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatProperty(property: IProperty) {
  return {
    propertyId: property.propertyId,
    propertyNumber: property.propertyNumber,
    title: property.title,
    description: property.description,
    category: property.category,
    status: property.status,
    ownershipType: property.ownershipType,
    ownerUserId: property.ownerUserId?.toString(),
    companyId: property.companyId,
    location: property.location,
    buildingSize: property.buildingSize,
    landSize: property.landSize,
    floors: property.floors,
    rooms: property.rooms,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    amenities: property.amenities,
    listPrice: property.listPrice,
    rentPriceMonthly: property.rentPriceMonthly,
    marketValue: property.marketValue,
    currency: property.currency,
    isFeatured: property.isFeatured,
    isAvailable: property.isAvailable,
    imageIds: property.imageIds,
    viewCount: property.viewCount,
    createdAt: (property as unknown as { createdAt?: Date }).createdAt?.toISOString(),
    updatedAt: (property as unknown as { updatedAt?: Date }).updatedAt?.toISOString(),
  };
}

export async function syncPropertyToBusinessAsset(property: IProperty, actorId: string) {
  if (!property.companyId) return null;

  const company = await Company.findOne({ companyId: property.companyId, deletedAt: null });
  if (!company) return null;

  const assetId = `AST-RE-${property.propertyId}`;
  const asset = await CompanyAsset.findOneAndUpdate(
    { assetId },
    {
      assetId,
      companyId: property.companyId,
      name: property.title,
      category: 'real_estate',
      purchaseCost: property.listPrice,
      currentValue: property.marketValue || property.listPrice,
      serialNumber: property.propertyNumber,
      status: property.status === 'sold' ? 'disposed' : 'active',
      updatedBy: new Types.ObjectId(actorId),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  company.totalAssets = await CompanyAsset.aggregate([
    { $match: { companyId: property.companyId, deletedAt: null, status: 'active' } },
    { $group: { _id: null, total: { $sum: '$currentValue' } } },
  ]).then((r) => r[0]?.total ?? 0);
  await company.save();

  return asset;
}

export async function recordPropertyRevenue(
  companyId: string,
  propertyId: string,
  amount: number,
  source: string,
  actorId: string
) {
  await CompanyRevenue.create({
    revenueId: `REV-RE-${uuidv4().slice(0, 8).toUpperCase()}`,
    companyId,
    source: `property:${source}`,
    category: 'real_estate',
    amount,
    description: `Property ${propertyId} - ${source}`,
    recordedBy: new Types.ObjectId(actorId),
    period: currentPeriod(),
    createdBy: new Types.ObjectId(actorId),
  });

  const company = await Company.findOne({ companyId, deletedAt: null });
  if (company) {
    company.totalRevenue += amount;
    company.monthlyIncome += amount;
    company.netProfit += amount;
    await company.save();
  }
}

export async function recordPropertyExpense(
  companyId: string,
  propertyId: string,
  amount: number,
  category: string,
  actorId: string
) {
  await CompanyExpense.create({
    expenseId: `EXP-RE-${uuidv4().slice(0, 8).toUpperCase()}`,
    companyId,
    category: `property_${category}`,
    amount,
    description: `Property ${propertyId} - ${category}`,
    status: 'paid',
    approvedBy: new Types.ObjectId(actorId),
    period: currentPeriod(),
    createdBy: new Types.ObjectId(actorId),
  });

  const company = await Company.findOne({ companyId, deletedAt: null });
  if (company) {
    company.totalExpenses += amount;
    company.netProfit -= amount;
    await company.save();
  }
}

export async function transferPropertyFunds(
  fromCompanyId: string | undefined,
  toCompanyId: string | undefined,
  fromUserId: string | undefined,
  toUserId: string | undefined,
  amount: number,
  description: string,
  reference: string
) {
  if (fromCompanyId) {
    await withdraw(fromCompanyId, amount, description, 'main', reference);
  }
  if (toCompanyId) {
    await deposit(toCompanyId, amount, description, 'main', reference);
  }
  return { transferred: amount, reference, fromCompanyId, toCompanyId, fromUserId, toUserId };
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function searchPropertiesForPolice(query: string) {
  const properties = await Property.find({
    deletedAt: null,
    $or: [
      { title: new RegExp(query, 'i') },
      { propertyNumber: new RegExp(query, 'i') },
      { 'location.street': new RegExp(query, 'i') },
      { 'location.district': new RegExp(query, 'i') },
    ],
  }).limit(20);

  return properties.map((p) => ({
    propertyId: p.propertyId,
    propertyNumber: p.propertyNumber,
    title: p.title,
    type: p.category,
    address: `${p.location.street}, ${p.location.district}, ${p.location.city}`,
    ownerUserId: p.ownerUserId?.toString(),
    companyId: p.companyId,
    status: p.status,
    marketValue: p.marketValue,
  }));
}

export { searchIdentity, searchPhone, getBankIntegration, getWorldLocation };
