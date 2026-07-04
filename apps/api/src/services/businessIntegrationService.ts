import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { CompanyAuditLog } from '../database/models/CompanyAuditLog';
import type { ICompany } from '../database/models/Company';
import { logAudit } from './auditService';
import { enqueueNotification } from './notificationBrokerService';
import { BUSINESS_APP_BUNDLE } from '../constants/business';
import {
  searchIdentity,
  searchPhone,
  getBankIntegration,
  getWorldLocation,
} from './policeIntegrationService';

export async function logBusinessAction(params: {
  companyId: string;
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
    metadata: {
      ...params.metadata,
      companyId: params.companyId,
      deviceUuid: params.deviceUuid,
      signatureHash: params.signatureHash,
    },
    ipAddress: params.ipAddress,
  });

  await CompanyAuditLog.create({
    logId: `BLOG-${uuidv4().slice(0, 8).toUpperCase()}`,
    companyId: params.companyId,
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

export async function notifyBusinessUser(
  userId: string,
  title: string,
  body: string,
  deepLink?: string
) {
  try {
    await enqueueNotification({
      userId,
      appId: BUSINESS_APP_BUNDLE,
      title,
      body,
      icon: '🏢',
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

export function formatCompany(company: ICompany & { createdAt?: Date; updatedAt?: Date }) {
  return {
    companyId: company.companyId,
    name: company.name,
    tradeName: company.tradeName,
    licenseNumber: company.licenseNumber,
    commercialRegistration: company.commercialRegistration,
    taxNumber: company.taxNumber,
    category: company.category,
    ownerUserId: company.ownerUserId.toString(),
    headquarters: company.headquarters,
    logo: company.logo,
    banner: company.banner,
    description: company.description,
    website: company.website,
    email: company.email,
    phone: company.phone,
    status: company.status,
    iban: company.iban,
    walletId: company.walletId,
    availableBalance: company.availableBalance,
    totalRevenue: company.totalRevenue,
    totalExpenses: company.totalExpenses,
    netProfit: company.netProfit,
    employeeCount: company.employeeCount,
    customerCount: company.customerCount,
    createdAt: company.createdAt?.toISOString(),
    updatedAt: company.updatedAt?.toISOString(),
  };
}

export { searchIdentity, searchPhone, getBankIntegration, getWorldLocation };
