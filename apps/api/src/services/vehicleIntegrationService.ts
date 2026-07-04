import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { VehicleAuditLog } from '../database/models/VehicleAuditLog';
import { Company } from '../database/models/Company';
import { CompanyAsset } from '../database/models/CompanyAsset';
import { CompanyRevenue } from '../database/models/CompanyRevenue';
import { CompanyExpense } from '../database/models/CompanyExpense';
import { VehicleDealer } from '../database/models/VehicleDealer';
import { logAudit } from './auditService';
import { enqueueNotification } from './notificationBrokerService';
import { withdraw, deposit } from './businessBankService';
import { VEHICLES_APP_BUNDLE } from '../constants/vehicles';
import { searchIdentity, searchPhone, getBankIntegration, getWorldLocation } from './policeIntegrationService';
import type { IVehicle } from '../database/models/Vehicle';

export async function logVehicleAction(params: {
  vehicleId?: string;
  dealerId?: string;
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
    metadata: { ...params.metadata, vehicleId: params.vehicleId, dealerId: params.dealerId },
    ipAddress: params.ipAddress,
  });

  await VehicleAuditLog.create({
    logId: `VLOG-${uuidv4().slice(0, 8).toUpperCase()}`,
    vehicleId: params.vehicleId,
    dealerId: params.dealerId,
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

export async function notifyVehicleUser(userId: string, title: string, body: string, deepLink?: string) {
  try {
    await enqueueNotification({ userId, appId: VEHICLES_APP_BUNDLE, title, body, icon: '🚗', deepLink, actorId: userId });
  } catch { /* permission */ }
}

export function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatVehicle(vehicle: IVehicle) {
  return {
    vehicleId: vehicle.vehicleId,
    vin: vehicle.vin,
    plateNumber: vehicle.plateNumber,
    brand: vehicle.brand,
    manufacturer: vehicle.manufacturer,
    model: vehicle.vehicleModel,
    year: vehicle.year,
    category: vehicle.category,
    mileage: vehicle.mileage,
    specs: vehicle.specs,
    color: vehicle.color,
    condition: vehicle.condition,
    listPrice: vehicle.listPrice,
    dealerPrice: vehicle.dealerPrice,
    marketValue: vehicle.marketValue,
    status: vehicle.status,
    ownerUserId: vehicle.ownerUserId?.toString(),
    companyId: vehicle.companyId,
    dealerId: vehicle.dealerId,
    location: vehicle.location,
    isFeatured: vehicle.isFeatured,
    isAvailable: vehicle.isAvailable,
    imageIds: vehicle.imageIds,
    viewCount: vehicle.viewCount,
    createdAt: (vehicle as unknown as { createdAt?: Date }).createdAt?.toISOString(),
  };
}

export async function syncVehicleToBusinessAsset(vehicle: IVehicle, actorId: string) {
  if (!vehicle.companyId) return null;
  const assetId = `AST-VH-${vehicle.vehicleId}`;
  const asset = await CompanyAsset.findOneAndUpdate(
    { assetId },
    {
      assetId,
      companyId: vehicle.companyId,
      name: `${vehicle.year} ${vehicle.brand} ${vehicle.vehicleModel}`,
      category: 'vehicle',
      purchaseCost: vehicle.dealerPrice ?? vehicle.listPrice,
      currentValue: vehicle.marketValue || vehicle.listPrice,
      serialNumber: vehicle.vin,
      status: vehicle.status === 'sold' ? 'disposed' : 'active',
      updatedBy: new Types.ObjectId(actorId),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const company = await Company.findOne({ companyId: vehicle.companyId, deletedAt: null });
  if (company) {
    const total = await CompanyAsset.aggregate([
      { $match: { companyId: vehicle.companyId, deletedAt: null, status: 'active' } },
      { $group: { _id: null, total: { $sum: '$currentValue' } } },
    ]);
    company.totalAssets = total[0]?.total ?? 0;
    await company.save();
  }
  return asset;
}

export async function recordVehicleRevenue(companyId: string, vehicleId: string, amount: number, actorId: string) {
  await CompanyRevenue.create({
    revenueId: `REV-VH-${uuidv4().slice(0, 8).toUpperCase()}`,
    companyId,
    source: 'vehicle_sale',
    category: 'automotive',
    amount,
    description: `Vehicle sale ${vehicleId}`,
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
  const dealer = await VehicleDealer.findOne({ companyId, deletedAt: null });
  if (dealer) {
    dealer.totalRevenue += amount;
    dealer.netProfit += amount;
    await dealer.save();
  }
}

export async function recordVehicleExpense(companyId: string, vehicleId: string, amount: number, category: string, actorId: string) {
  await CompanyExpense.create({
    expenseId: `EXP-VH-${uuidv4().slice(0, 8).toUpperCase()}`,
    companyId,
    category: `vehicle_${category}`,
    amount,
    description: `Vehicle ${vehicleId} - ${category}`,
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
  const dealer = await VehicleDealer.findOne({ companyId, deletedAt: null });
  if (dealer) {
    dealer.totalExpenses += amount;
    dealer.netProfit -= amount;
    await dealer.save();
  }
}

export async function transferVehicleFunds(
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

export async function searchVehiclesForPolice(query: string) {
  const { Vehicle } = await import('../database/models/Vehicle');
  const vehicles = await Vehicle.find({
    deletedAt: null,
    $or: [
      { plateNumber: new RegExp(query, 'i') },
      { vin: new RegExp(query, 'i') },
      { brand: new RegExp(query, 'i') },
      { vehicleModel: new RegExp(query, 'i') },
    ],
  }).limit(20);
  return vehicles.map((v) => ({
    vehicleId: v.vehicleId,
    vin: v.vin,
    plateNumber: v.plateNumber,
    brand: v.brand,
    model: v.vehicleModel,
    year: v.year,
    color: v.color,
    ownerUserId: v.ownerUserId?.toString(),
    companyId: v.companyId,
    status: v.status,
  }));
}

export { searchIdentity, searchPhone, getBankIntegration, getWorldLocation };
