import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { ExchangeAuditLog } from '../database/models/ExchangeAuditLog';
import { CompanyValuation } from '../database/models/CompanyValuation';
import { EconomyState } from '../database/models/EconomyState';
import { MarketDemand } from '../database/models/MarketDemand';
import { EconomicEvent } from '../database/models/EconomicEvent';
import { Company } from '../database/models/Company';
import { logAudit } from './auditService';
import { enqueueNotification } from './notificationBrokerService';
import { EXCHANGE_APP_BUNDLE } from '../constants/exchange';
import { currentPeriod } from './economyIntegrationService';

/** Consumes Economy Engine data — NEVER calculates company valuation here */
export async function getEconomyValuation(companyId: string) {
  const period = currentPeriod();
  let valuation = await CompanyValuation.findOne({ companyId, period });
  if (!valuation) {
    valuation = await CompanyValuation.findOne({ companyId }).sort({ computedAt: -1 });
  }
  if (!valuation) throw new Error('NO_ECONOMY_VALUATION');
  return valuation;
}

export async function getEconomyState() {
  return EconomyState.findOne({ stateId: 'ECONOMY-STATE' });
}

export async function getSectorDemand(sector: string) {
  const period = currentPeriod();
  const sectorMap: Record<string, string> = {
    real_estate: 'real_estate', automotive: 'vehicles', aviation: 'aviation',
    marine: 'marine', technology: 'general', finance: 'general',
  };
  const economySector = sectorMap[sector] ?? 'general';
  return MarketDemand.findOne({ sector: economySector, period });
}

export async function getActiveEconomicEvents(sector?: string) {
  const filter: Record<string, unknown> = { active: true, startsAt: { $lte: new Date() } };
  if (sector) filter.$or = [{ sector }, { sector: { $exists: false } }];
  return EconomicEvent.find(filter);
}

export async function syncBusinessMetrics(companyId: string) {
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) return null;
  const valuation = await getEconomyValuation(companyId).catch(() => null);
  return {
    companyId,
    name: company.name,
    revenue: company.totalRevenue,
    expenses: company.totalExpenses,
    profit: company.netProfit,
    assets: company.totalAssets,
    debt: company.totalDebt,
    taxes: valuation?.taxes ?? 0,
    employees: company.employeeCount,
    inventory: company.inventoryValue,
    properties: valuation?.properties ?? 0,
    vehicles: valuation?.vehicles ?? 0,
    aircraft: valuation?.aircraft ?? 0,
    marineFleet: valuation?.marineFleet ?? 0,
    valuation: valuation?.totalValuation ?? 0,
    economyValuationId: valuation?.valuationId,
  };
}

export async function logExchangeAction(params: {
  userId: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  deviceUuid?: string;
}) {
  await logAudit({
    userId: params.userId,
    actorId: params.actorId,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    metadata: params.metadata,
    ipAddress: params.ipAddress,
  });

  await ExchangeAuditLog.create({
    logId: `XLOG-${uuidv4().slice(0, 8).toUpperCase()}`,
    userId: new Types.ObjectId(params.userId),
    actorId: new Types.ObjectId(params.actorId),
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    metadata: params.metadata,
    ipAddress: params.ipAddress,
    deviceUuid: params.deviceUuid,
  });
}

export async function notifyExchangeUser(userId: string, title: string, body: string, deepLink?: string) {
  try {
    await enqueueNotification({
      userId, appId: EXCHANGE_APP_BUNDLE, title, body, icon: '📈', deepLink, actorId: userId,
    });
  } catch { /* permission */ }
}

export { searchIdentity, searchPhone, getBankIntegration, getWorldLocation } from './policeIntegrationService';
