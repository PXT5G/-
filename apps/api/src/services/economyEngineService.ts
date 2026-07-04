import { v4 as uuidv4 } from 'uuid';
import { Company } from '../database/models/Company';
import { CompanyAsset } from '../database/models/CompanyAsset';
import { CompanyCustomer } from '../database/models/CompanyCustomer';
import { CompanyLoan } from '../database/models/CompanyLoan';
import { CompanyTax } from '../database/models/CompanyTax';
import { CompanyRevenue } from '../database/models/CompanyRevenue';
import { Property } from '../database/models/Property';
import { Vehicle } from '../database/models/Vehicle';
import { Aircraft } from '../database/models/Aircraft';
import { Vessel } from '../database/models/Vessel';
import { PropertySale } from '../database/models/PropertySale';
import { VehicleSale } from '../database/models/VehicleSale';
import { AircraftSale } from '../database/models/AircraftSale';
import { MarineSale } from '../database/models/MarineSale';
import { VehicleFinance } from '../database/models/VehicleFinance';
import { AircraftFinance } from '../database/models/AircraftFinance';
import { MarineFinance } from '../database/models/MarineFinance';
import { User } from '../database/models/User';
import { WorldState } from '../database/models/WorldState';
import { EconomyState } from '../database/models/EconomyState';
import { EconomicReport } from '../database/models/EconomicReport';
import { CompanyValuation } from '../database/models/CompanyValuation';
import { MarketDemand } from '../database/models/MarketDemand';
import { MarketSupply } from '../database/models/MarketSupply';
import { AssetValuation } from '../database/models/AssetValuation';
import { InflationHistory } from '../database/models/InflationHistory';
import { GDPHistory } from '../database/models/GDPHistory';
import { EconomicEvent } from '../database/models/EconomicEvent';
import { EconomyAuditLog } from '../database/models/EconomyAuditLog';
import {
  ECONOMY_SECTORS,
  ECONOMY_SOCKET_EVENTS,
  VALUATION_PROFIT_MULTIPLIER,
  VALUATION_EMPLOYEE_VALUE,
  VALUATION_CUSTOMER_VALUE,
  VALUATION_INVENTORY_FACTOR,
  MAX_PRICE_ADJUSTMENT,
  BASE_INTEREST_RATE,
  TARGET_INFLATION,
  type EconomySector,
} from '../constants/economy';
import { seedEconomyRoleConfigs, assertEconomyPermission } from './economyRBACService';
import { logEconomyAction, currentPeriod, currentHourPeriod } from './economyIntegrationService';
import { broadcast } from './socketService';
import { publishEvent } from './eventBusService';

const LISTED_STATUSES = ['listed', 'under_offer', 'in_auction', 'featured'];

let tickInProgress = false;

export async function initializeEconomy(userId: string, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'platform.access', userRole);
  await seedEconomyRoleConfigs();

  const period = currentPeriod();
  let state = await EconomyState.findOne({ stateId: 'ECONOMY-STATE' });
  if (!state) {
    state = await EconomyState.create({
      stateId: 'ECONOMY-STATE',
      period,
      marketConfidence: 0.5,
      sectorIndices: Object.fromEntries(ECONOMY_SECTORS.map((s) => [s, 100])),
      computedAt: new Date(),
    });
    await tickEconomy(userId);
  }

  await logEconomyAction({
    userId,
    actorId: userId,
    action: 'economy_initialized',
    resource: 'economy_state',
    resourceId: state.stateId,
  });

  return { initialized: true, state, roles: await import('../constants/economy').then((m) => m.ECONOMY_ROLES) };
}

export async function tickEconomy(actorId = 'system'): Promise<Record<string, unknown>> {
  if (tickInProgress) return { skipped: true, reason: 'tick_in_progress' };
  tickInProgress = true;

  try {
    const period = currentPeriod();
    const hourPeriod = currentHourPeriod();
    const previousState = await EconomyState.findOne({ stateId: 'ECONOMY-STATE' });
    const population = await User.countDocuments({ deletedAt: null });
    const activeCompanies = await Company.countDocuments({ deletedAt: null, status: { $ne: 'suspended' } });

    const bankMetrics = await aggregateBankMetrics();
    const { demands, supplies, sectorIndices } = await calculateDemandSupply(population, period);
    const inflation = await calculateInflation(sectorIndices, period, previousState?.inflationRate ?? TARGET_INFLATION);
    const gdp = await calculateGDP(period, bankMetrics);
    const priceUpdates = await updateMarketPrices(demands, supplies, inflation.rate, period);
    const valuations = await calculateAllCompanyValuations(period, inflation.rate, previousState?.marketConfidence ?? 0.5);
    const consumerSpending = await calculateConsumerSpending();
    const { growthRate, failureRate } = await calculateBusinessMetrics(activeCompanies);

    const totalCompanyValuation = valuations.reduce((s, v) => s + v.totalValuation, 0);
    const totalAssetValue = priceUpdates.totalAssetValue;
    const liquidity = bankMetrics.totalLoans > 0
      ? (gdp.gdp - bankMetrics.totalLoans) / gdp.gdp
      : 0.75;
    const marketConfidence = clamp(
      0.5
      + (gdp.growth * 2)
      - (inflation.rate - TARGET_INFLATION)
      - (bankMetrics.defaults * 0.01)
      + (demands.general?.index ?? 1 - 1) * 0.1,
      0.05,
      0.99
    );

    const state = await EconomyState.findOneAndUpdate(
      { stateId: 'ECONOMY-STATE' },
      {
        stateId: 'ECONOMY-STATE',
        period,
        gdp: gdp.gdp,
        gdpGrowth: gdp.growth,
        inflationRate: inflation.rate,
        deflationRate: inflation.rate < 0 ? Math.abs(inflation.rate) : 0,
        marketConfidence,
        consumerSpending,
        businessGrowthRate: growthRate,
        businessFailureRate: failureRate,
        liquidity,
        totalMoneySupply: gdp.gdp + totalCompanyValuation * 0.3,
        totalAssetValue,
        totalCompanyValuation,
        population,
        activeCompanies,
        activeListings: priceUpdates.listingCount,
        bankMetrics,
        sectorIndices,
        lastTickAt: new Date(),
        $inc: { tickCount: 1 },
        computedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    const report = await generateEconomicReport(state, valuations.map((v, i) => ({
      companyId: v.companyId,
      companyName: v.companyName,
      totalValuation: v.totalValuation,
      rank: v.rank ?? i + 1,
    })), demands, supplies, hourPeriod);

    for (const event of ECONOMY_SOCKET_EVENTS) {
      broadcast(event as never, { period, stateId: state.stateId, tickAt: state.lastTickAt });
    }

    await publishEvent({
      userId: actorId,
      namespace: 'economy.engine',
      event: 'economy:tick:complete',
      payload: { period, gdp: gdp.gdp, inflation: inflation.rate, marketConfidence },
      source: 'economyEngineService',
    });

    await logEconomyAction({
      userId: actorId,
      actorId,
      action: 'economy_tick',
      resource: 'economy_state',
      resourceId: state.stateId,
      metadata: { gdp: gdp.gdp, inflation: inflation.rate, valuations: valuations.length },
    });

    return { period, gdp, inflation, marketConfidence, reportId: report.reportId, priceUpdates: priceUpdates.updated };
  } finally {
    tickInProgress = false;
  }
}

async function aggregateBankMetrics() {
  const [companyLoans, vehicleFinance, aircraftFinance, marineFinance, mortgageSales] = await Promise.all([
    CompanyLoan.aggregate([
      { $match: { deletedAt: null, status: 'active' } },
      { $group: { _id: null, total: { $sum: '$remainingBalance' }, interest: { $sum: { $multiply: ['$remainingBalance', { $divide: ['$interestRate', 100] }] } } } },
    ]),
    VehicleFinance.aggregate([
      { $match: { deletedAt: null, status: { $in: ['active', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$remainingBalance' }, defaults: { $sum: { $cond: [{ $eq: ['$status', 'defaulted'] }, 1, 0] } } } },
    ]),
    AircraftFinance.aggregate([
      { $match: { deletedAt: null, status: { $in: ['active', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$remainingBalance' }, defaults: { $sum: { $cond: [{ $eq: ['$status', 'defaulted'] }, 1, 0] } } } },
    ]),
    MarineFinance.aggregate([
      { $match: { deletedAt: null, status: { $in: ['active', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$remainingBalance' }, defaults: { $sum: { $cond: [{ $eq: ['$status', 'defaulted'] }, 1, 0] } } } },
    ]),
    PropertySale.countDocuments({ paymentType: 'mortgage', deletedAt: null }),
  ]);

  const [defaultedLoans, defaultedVehicle, defaultedAircraft, defaultedMarine] = await Promise.all([
    CompanyLoan.countDocuments({ deletedAt: null, status: 'defaulted' }),
    VehicleFinance.countDocuments({ deletedAt: null, status: 'defaulted' }),
    AircraftFinance.countDocuments({ deletedAt: null, status: 'defaulted' }),
    MarineFinance.countDocuments({ deletedAt: null, status: 'defaulted' }),
  ]);

  const totalLoans = companyLoans[0]?.total ?? 0;
  const totalFinancing = (vehicleFinance[0]?.total ?? 0) + (aircraftFinance[0]?.total ?? 0) + (marineFinance[0]?.total ?? 0);

  return {
    totalLoans,
    totalMortgages: mortgageSales,
    totalFinancing,
    totalInterest: companyLoans[0]?.interest ?? 0,
    activeInstallments: await VehicleFinance.countDocuments({ deletedAt: null, status: 'active' })
      + await AircraftFinance.countDocuments({ deletedAt: null, status: 'active' })
      + await MarineFinance.countDocuments({ deletedAt: null, status: 'active' }),
    latePayments: 0,
    defaults: defaultedLoans + defaultedVehicle + defaultedAircraft + defaultedMarine,
  };
}

async function calculateDemandSupply(population: number, period: string) {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const activeEvents = await EconomicEvent.find({ active: true, startsAt: { $lte: new Date() } });
  const eventImpact = activeEvents.reduce((s, e) => s + e.impact, 0);

  const worlds = await WorldState.find({ deletedAt: null }).limit(50);
  const weatherFactor = worlds.length > 0
    ? worlds.reduce((s, w) => s + (w.weather === 'clear' ? 0.02 : w.weather === 'thunderstorm' ? -0.05 : 0), 0) / worlds.length
    : 0;

  const governmentFactor = await Company.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: null, contracts: { $sum: '$governmentContractCount' }, fines: { $sum: '$finesOwed' } } },
  ]);
  const govBoost = ((governmentFactor[0]?.contracts ?? 0) * 0.001) - ((governmentFactor[0]?.fines ?? 0) * 0.0001);

  const sectorConfigs: { sector: EconomySector; salesModel: typeof PropertySale; assetModel: typeof Property; priceField: string }[] = [
    { sector: 'real_estate', salesModel: PropertySale as never, assetModel: Property as never, priceField: 'listPrice' },
    { sector: 'vehicles', salesModel: VehicleSale as never, assetModel: Vehicle as never, priceField: 'listPrice' },
    { sector: 'aviation', salesModel: AircraftSale as never, assetModel: Aircraft as never, priceField: 'listPrice' },
    { sector: 'marine', salesModel: MarineSale as never, assetModel: Vessel as never, priceField: 'listPrice' },
  ];

  const demands: Record<string, IMarketDemandLike> = {};
  const supplies: Record<string, IMarketSupplyLike> = {};
  const sectorIndices: Record<string, number> = {};

  for (const cfg of sectorConfigs) {
    const recentSales = await cfg.salesModel.countDocuments({ createdAt: { $gte: hourAgo }, deletedAt: null });
    const listings = await cfg.assetModel.find({ status: { $in: LISTED_STATUSES }, deletedAt: null });
    const listingCount = listings.length;
    const totalValue = listings.reduce((s, a) => {
      const doc = a as unknown as { marketValue?: number; listPrice?: number };
      return s + (doc.marketValue || doc.listPrice || 0);
    }, 0);
    const avgPrice = listingCount > 0 ? totalValue / listingCount : 0;

    const sectorEvents = activeEvents.filter((e) => !e.sector || e.sector === cfg.sector);
    const sectorEventImpact = sectorEvents.reduce((s, e) => s + e.impact, 0);

    const populationFactor = Math.log10(Math.max(population, 1)) * 0.05;
    const salesFactor = recentSales * 0.02;
    const supplyFactor = listingCount > 0 ? -Math.log10(listingCount) * 0.03 : 0.05;
    const economyFactor = BASE_INTEREST_RATE * 0.5;

    const demandIndex = clamp(1 + populationFactor + salesFactor + supplyFactor + sectorEventImpact + weatherFactor + govBoost + economyFactor, 0.1, 3);

    const prevDemand = await MarketDemand.findOne({ sector: cfg.sector, period });
    const demandChange = prevDemand ? demandIndex - prevDemand.index : 0;

    await MarketDemand.findOneAndUpdate(
      { sector: cfg.sector, period },
      {
        demandId: `DMD-${cfg.sector}-${period}`,
        sector: cfg.sector,
        period,
        index: demandIndex,
        change: demandChange,
        factors: { population: populationFactor, sales: salesFactor, supply: supplyFactor, events: sectorEventImpact, government: govBoost, weather: weatherFactor, economy: economyFactor },
        computedAt: new Date(),
      },
      { upsert: true }
    );

    const supplyIndex = listingCount > 0 ? clamp(listingCount / Math.max(population * 0.01, 1), 0.1, 5) : 0.5;
    const prevSupply = await MarketSupply.findOne({ sector: cfg.sector, period });
    const supplyChange = prevSupply ? supplyIndex - prevSupply.index : 0;

    await MarketSupply.findOneAndUpdate(
      { sector: cfg.sector, period },
      {
        supplyId: `SUP-${cfg.sector}-${period}`,
        sector: cfg.sector,
        period,
        index: supplyIndex,
        change: supplyChange,
        listingCount,
        totalValue,
        averagePrice: avgPrice,
        computedAt: new Date(),
      },
      { upsert: true }
    );

    demands[cfg.sector] = { index: demandIndex, change: demandChange };
    supplies[cfg.sector] = { index: supplyIndex, listingCount, totalValue, averagePrice: avgPrice };
    sectorIndices[cfg.sector] = demandIndex / Math.max(supplyIndex, 0.1) * 100;
  }

  const assetCount = await CompanyAsset.countDocuments({ deletedAt: null, status: 'active' });
  const generalDemand = clamp(1 + eventImpact * 0.1 + weatherFactor, 0.1, 3);
  demands.general = { index: generalDemand, change: 0 };
  supplies.general = { index: assetCount / Math.max(population, 1), listingCount: assetCount, totalValue: 0, averagePrice: 0 };
  sectorIndices.general = generalDemand * 100;
  sectorIndices.business_assets = sectorIndices.general;

  return { demands, supplies, sectorIndices };
}

interface IMarketDemandLike { index: number; change: number }
interface IMarketSupplyLike { index: number; listingCount: number; totalValue: number; averagePrice: number }

async function calculateInflation(sectorIndices: Record<string, number>, period: string, previousRate: number) {
  const avgIndex = Object.values(sectorIndices).reduce((s, v) => s + v, 0) / Math.max(Object.keys(sectorIndices).length, 1);
  const prevRecord = await InflationHistory.findOne({ period: { $ne: period } }).sort({ recordedAt: -1 });
  const previousIndex = prevRecord?.priceIndex ?? 100;
  const priceIndex = avgIndex;
  const rate = previousIndex > 0 ? (priceIndex - previousIndex) / previousIndex : previousRate;
  const smoothedRate = previousRate * 0.7 + rate * 0.3;

  await InflationHistory.findOneAndUpdate(
    { period },
    {
      historyId: `INF-${period}`,
      period,
      rate: smoothedRate,
      priceIndex,
      previousIndex,
      change: priceIndex - previousIndex,
      sectorRates: Object.fromEntries(Object.entries(sectorIndices).map(([k, v]) => [k, v / 100 - 1])),
      recordedAt: new Date(),
    },
    { upsert: true }
  );

  return { rate: smoothedRate, priceIndex };
}

async function calculateGDP(period: string, bankMetrics: { totalLoans: number; totalFinancing: number }) {
  const [revenueAgg, salesAgg, govContracts] = await Promise.all([
    CompanyRevenue.aggregate([
      { $match: { deletedAt: null, period } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Promise.all([
      PropertySale.aggregate([{ $match: { deletedAt: null, createdAt: { $gte: monthStart() } } }, { $group: { _id: null, total: { $sum: '$salePrice' } } }]),
      VehicleSale.aggregate([{ $match: { deletedAt: null, createdAt: { $gte: monthStart() } } }, { $group: { _id: null, total: { $sum: '$salePrice' } } }]),
      AircraftSale.aggregate([{ $match: { deletedAt: null, createdAt: { $gte: monthStart() } } }, { $group: { _id: null, total: { $sum: '$salePrice' } } }]),
      MarineSale.aggregate([{ $match: { deletedAt: null, createdAt: { $gte: monthStart() } } }, { $group: { _id: null, total: { $sum: '$salePrice' } } }]),
    ]),
    Company.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: null, total: { $sum: '$governmentContractCount' } } },
    ]),
  ]);

  const revenueTotal = revenueAgg[0]?.total ?? 0;
  const transactionVolume = salesAgg.reduce((s, a) => s + (a[0]?.total ?? 0), 0);
  const governmentContracts = (govContracts[0]?.total ?? 0) * 10000;
  const gdp = revenueTotal + transactionVolume + governmentContracts + bankMetrics.totalFinancing * 0.1;

  const prevGdp = await GDPHistory.findOne({ period: { $ne: period } }).sort({ recordedAt: -1 });
  const previousGdp = prevGdp?.gdp ?? gdp;
  const growth = previousGdp > 0 ? (gdp - previousGdp) / previousGdp : 0;

  const sectorContributions = {
    business_revenue: revenueTotal,
    marketplace_transactions: transactionVolume,
    government: governmentContracts,
    financing: bankMetrics.totalFinancing * 0.1,
  };

  await GDPHistory.findOneAndUpdate(
    { period },
    {
      historyId: `GDP-${period}`,
      period,
      gdp,
      previousGdp,
      growth,
      revenueTotal,
      transactionVolume,
      governmentContracts,
      sectorContributions,
      recordedAt: new Date(),
    },
    { upsert: true }
  );

  return { gdp, growth, revenueTotal, transactionVolume, governmentContracts, sectorContributions };
}

async function updateMarketPrices(
  demands: Record<string, IMarketDemandLike>,
  supplies: Record<string, IMarketSupplyLike>,
  inflationRate: number,
  period: string
) {
  const configs: { sector: EconomySector; model: typeof Property; assetType: 'property' | 'vehicle' | 'aircraft' | 'vessel'; prefix: string; idField: string; socketEvent: string }[] = [
    { sector: 'real_estate', model: Property as never, assetType: 'property', prefix: 'AST-RE-', idField: 'propertyId', socketEvent: 'realestate:price:change' },
    { sector: 'vehicles', model: Vehicle as never, assetType: 'vehicle', prefix: 'AST-VH-', idField: 'vehicleId', socketEvent: 'vehicles:price:change' },
    { sector: 'aviation', model: Aircraft as never, assetType: 'aircraft', prefix: 'AST-AC-', idField: 'aircraftId', socketEvent: 'aviation:price:change' },
    { sector: 'marine', model: Vessel as never, assetType: 'vessel', prefix: 'AST-VS-', idField: 'vesselId', socketEvent: 'marine:price:change' },
  ];

  let updated = 0;
  let listingCount = 0;
  let totalAssetValue = 0;

  for (const cfg of configs) {
    const demand = demands[cfg.sector]?.index ?? 1;
    const supply = supplies[cfg.sector]?.index ?? 1;
    const demandSupplyRatio = demand / Math.max(supply, 0.1);
    const adjustment = clamp((demandSupplyRatio - 1) * 0.02 + inflationRate * 0.5, -MAX_PRICE_ADJUSTMENT, MAX_PRICE_ADJUSTMENT);

    const assets = await cfg.model.find({ deletedAt: null, status: { $in: LISTED_STATUSES } });
    listingCount += assets.length;

    for (const asset of assets) {
      const assetDoc = asset as unknown as { marketValue: number; listPrice: number; companyId?: string };
      const prev = assetDoc.marketValue || assetDoc.listPrice || 0;
      const next = Math.round(prev * (1 + adjustment));
      if (next === prev) continue;

      assetDoc.marketValue = next;
      await asset.save();
      totalAssetValue += next;
      updated++;

      const assetId = (asset as unknown as Record<string, string>)[cfg.idField];
      await AssetValuation.findOneAndUpdate(
        { assetType: cfg.assetType, assetId, period },
        {
          valuationId: `AVL-${cfg.assetType}-${assetId}-${period}`,
          assetType: cfg.assetType,
          assetId,
          companyId: assetDoc.companyId,
          period,
          previousValue: prev,
          currentValue: next,
          change: next - prev,
          changePercent: prev > 0 ? (next - prev) / prev : 0,
          demandFactor: demand,
          inflationFactor: inflationRate,
          sector: cfg.sector,
          computedAt: new Date(),
        },
        { upsert: true }
      );

      if (assetDoc.companyId) {
        await CompanyAsset.findOneAndUpdate(
          { assetId: `${cfg.prefix}${assetId}`, deletedAt: null },
          { currentValue: next }
        );
      }

      broadcast(cfg.socketEvent as never, { assetId, previousValue: prev, currentValue: next, period });
    }
  }

  const companyAssets = await CompanyAsset.find({ deletedAt: null, status: 'active', category: { $nin: ['property', 'vehicle', 'aircraft', 'vessel'] } });
  const generalAdjustment = clamp(inflationRate * 0.3, -MAX_PRICE_ADJUSTMENT, MAX_PRICE_ADJUSTMENT);
  for (const asset of companyAssets) {
    const prev = asset.currentValue;
    const next = Math.round(prev * (1 + generalAdjustment));
    if (next === prev) continue;
    asset.currentValue = next;
    await asset.save();
    totalAssetValue += next;
    updated++;
  }

  return { updated, listingCount, totalAssetValue };
}

async function calculateBusinessRating(companyId: string): Promise<number> {
  const customers = await CompanyCustomer.find({ companyId, deletedAt: null });
  if (customers.length === 0) return 3;
  let totalRating = 0;
  let count = 0;
  for (const c of customers) {
    for (const r of c.reviews) {
      totalRating += r.rating;
      count++;
    }
  }
  return count > 0 ? clamp(totalRating / count, 1, 5) : 3;
}

async function calculateCompanyValuation(
  company: InstanceType<typeof Company>,
  period: string,
  inflationRate: number,
  marketConfidence: number
) {
  const companyId = company.companyId;
  const [assetBreakdown, taxAgg, businessRating] = await Promise.all([
    CompanyAsset.aggregate([
      { $match: { companyId, deletedAt: null, status: 'active' } },
      { $group: { _id: '$category', total: { $sum: '$currentValue' } } },
    ]),
    CompanyTax.aggregate([
      { $match: { companyId, deletedAt: null, status: { $in: ['filed', 'paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    calculateBusinessRating(companyId),
  ]);

  const categoryMap = Object.fromEntries(assetBreakdown.map((a) => [a._id, a.total]));
  const cash = company.cashBalance ?? 0;
  const bankBalance = (company.availableBalance ?? 0) + (company.payrollAccountBalance ?? 0)
    + (company.taxAccountBalance ?? 0) + (company.loanAccountBalance ?? 0);
  const revenue = company.totalRevenue ?? 0;
  const expenses = company.totalExpenses ?? 0;
  const profit = company.netProfit ?? 0;
  const employees = company.employeeCount ?? 0;
  const assets = company.totalAssets ?? 0;
  const vehicles = categoryMap.vehicle ?? 0;
  const aircraft = categoryMap.aircraft ?? 0;
  const marineFleet = categoryMap.vessel ?? 0;
  const properties = categoryMap.property ?? 0;
  const loans = company.totalLoans ?? 0;
  const debt = company.totalDebt ?? 0;
  const taxes = taxAgg[0]?.total ?? 0;
  const inventory = company.inventoryValue ?? 0;
  const customers = company.customerCount ?? 0;

  const ratingMultiplier = businessRating / 3;
  const confidenceMultiplier = 0.8 + marketConfidence * 0.4;
  const inflationAdj = 1 + inflationRate * 0.5;

  const components = {
    cash,
    bankBalance,
    tangibleAssets: assets,
    inventory: inventory * VALUATION_INVENTORY_FACTOR,
    annualizedProfit: profit * 12 * VALUATION_PROFIT_MULTIPLIER,
    employeeIntangible: employees * VALUATION_EMPLOYEE_VALUE,
    customerIntangible: customers * VALUATION_CUSTOMER_VALUE,
    debtDeduction: debt,
    loanDeduction: loans,
    taxDeduction: taxes * 0.5,
  };

  const baseValuation = components.cash + components.bankBalance + components.tangibleAssets
    + components.inventory + components.annualizedProfit + components.employeeIntangible
    + components.customerIntangible - components.debtDeduction - components.loanDeduction
    - components.taxDeduction;

  const totalValuation = Math.max(0, Math.round(baseValuation * ratingMultiplier * confidenceMultiplier * inflationAdj));

  return {
    companyId,
    companyName: company.name,
    period,
    totalValuation,
    cash, bankBalance, revenue, expenses, profit, employees, assets,
    vehicles, aircraft, marineFleet, properties, loans, debt, taxes, inventory, customers,
    businessRating,
    components,
  };
}

async function calculateAllCompanyValuations(period: string, inflationRate: number, marketConfidence: number) {
  const companies = await Company.find({ deletedAt: null, status: { $ne: 'suspended' } });
  const results: (Awaited<ReturnType<typeof calculateCompanyValuation>> & { rank?: number })[] = [];

  for (const company of companies) {
    const val = await calculateCompanyValuation(company, period, inflationRate, marketConfidence);
    results.push(val);

    await CompanyValuation.findOneAndUpdate(
      { companyId: val.companyId, period },
      {
        valuationId: `CVAL-${val.companyId}-${period}`,
        ...val,
        computedAt: new Date(),
      },
      { upsert: true }
    );
  }

  results.sort((a, b) => b.totalValuation - a.totalValuation);
  for (let i = 0; i < results.length; i++) {
    await CompanyValuation.updateOne(
      { companyId: results[i].companyId, period },
      { rank: i + 1 }
    );
    results[i].rank = i + 1;
  }

  broadcast('valuation:update' as never, { period, count: results.length, topCompany: results[0]?.companyId });
  return results;
}

async function calculateConsumerSpending() {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [prop, veh, ac, mar] = await Promise.all([
    PropertySale.aggregate([{ $match: { createdAt: { $gte: hourAgo }, deletedAt: null } }, { $group: { _id: null, total: { $sum: '$salePrice' } } }]),
    VehicleSale.aggregate([{ $match: { createdAt: { $gte: hourAgo }, deletedAt: null } }, { $group: { _id: null, total: { $sum: '$salePrice' } } }]),
    AircraftSale.aggregate([{ $match: { createdAt: { $gte: hourAgo }, deletedAt: null } }, { $group: { _id: null, total: { $sum: '$salePrice' } } }]),
    MarineSale.aggregate([{ $match: { createdAt: { $gte: hourAgo }, deletedAt: null } }, { $group: { _id: null, total: { $sum: '$salePrice' } } }]),
  ]);
  return (prop[0]?.total ?? 0) + (veh[0]?.total ?? 0) + (ac[0]?.total ?? 0) + (mar[0]?.total ?? 0);
}

async function calculateBusinessMetrics(activeCompanies: number) {
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const [newCompanies, failedCompanies, profitable] = await Promise.all([
    Company.countDocuments({ createdAt: { $gte: monthAgo }, deletedAt: null }),
    Company.countDocuments({ status: 'suspended', updatedAt: { $gte: monthAgo } }),
    Company.countDocuments({ deletedAt: null, netProfit: { $gt: 0 } }),
  ]);
  return {
    growthRate: activeCompanies > 0 ? newCompanies / activeCompanies : 0,
    failureRate: activeCompanies > 0 ? failedCompanies / activeCompanies : 0,
    profitableRatio: activeCompanies > 0 ? profitable / activeCompanies : 0,
  };
}

async function generateEconomicReport(
  state: InstanceType<typeof EconomyState>,
  valuations: { companyId: string; companyName: string; totalValuation: number; rank: number }[],
  demands: Record<string, IMarketDemandLike>,
  supplies: Record<string, IMarketSupplyLike>,
  hourPeriod: string
) {
  const sectorBreakdown: Record<string, { demand: number; supply: number; priceIndex: number }> = {};
  for (const sector of ECONOMY_SECTORS) {
    sectorBreakdown[sector] = {
      demand: demands[sector]?.index ?? 1,
      supply: supplies[sector]?.index ?? 1,
      priceIndex: state.sectorIndices[sector] ?? 100,
    };
  }

  const highlights: string[] = [];
  if (state.gdpGrowth > 0.02) highlights.push(`GDP grew ${(state.gdpGrowth * 100).toFixed(1)}%`);
  if (state.inflationRate > TARGET_INFLATION) highlights.push(`Inflation at ${(state.inflationRate * 100).toFixed(2)}% — above target`);
  if (state.marketConfidence > 0.7) highlights.push('Market confidence is strong');
  if (state.bankMetrics.defaults > 0) highlights.push(`${state.bankMetrics.defaults} loan defaults recorded`);

  const report = await EconomicReport.findOneAndUpdate(
    { period: hourPeriod, type: 'hourly' },
    {
      reportId: `ERPT-${hourPeriod}`,
      period: hourPeriod,
      type: 'hourly',
      summary: `GULF Economy hourly report — GDP ${state.gdp.toLocaleString()} GULF, inflation ${(state.inflationRate * 100).toFixed(2)}%`,
      gdp: state.gdp,
      gdpGrowth: state.gdpGrowth,
      inflationRate: state.inflationRate,
      marketConfidence: state.marketConfidence,
      consumerSpending: state.consumerSpending,
      businessGrowthRate: state.businessGrowthRate,
      businessFailureRate: state.businessFailureRate,
      liquidity: state.liquidity,
      topCompanies: valuations.slice(0, 10).map((v) => ({
        companyId: v.companyId,
        name: v.companyName,
        valuation: v.totalValuation,
        rank: v.rank,
      })),
      sectorBreakdown,
      bankSummary: state.bankMetrics as unknown as Record<string, number>,
      highlights,
      generatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return report;
}

export async function getDashboard(userId: string, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'dashboard.view', userRole);
  const state = await EconomyState.findOne({ stateId: 'ECONOMY-STATE' });
  const period = currentPeriod();
  const [valuations, demands, supplies, recentReport] = await Promise.all([
    CompanyValuation.find({ period }).sort({ rank: 1 }).limit(10),
    MarketDemand.find({ period }),
    MarketSupply.find({ period }),
    EconomicReport.findOne().sort({ generatedAt: -1 }),
  ]);
  return { state, valuations, demands, supplies, recentReport };
}

export async function getState(userId: string, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'state.view', userRole);
  return EconomyState.findOne({ stateId: 'ECONOMY-STATE' });
}

export async function getReports(userId: string, params: { page?: number; limit?: number; type?: string }, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'reports.view', userRole);
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const filter: Record<string, unknown> = {};
  if (params.type) filter.type = params.type;
  const [items, total] = await Promise.all([
    EconomicReport.find(filter).sort({ generatedAt: -1 }).skip((page - 1) * limit).limit(limit),
    EconomicReport.countDocuments(filter),
  ]);
  return { items, total, page, limit };
}

export async function getGdpHistory(userId: string, limit = 24, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'gdp.view', userRole);
  return GDPHistory.find().sort({ recordedAt: -1 }).limit(limit);
}

export async function getInflationHistory(userId: string, limit = 24, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'inflation.view', userRole);
  return InflationHistory.find().sort({ recordedAt: -1 }).limit(limit);
}

export async function getValuations(userId: string, params: { page?: number; limit?: number; period?: string }, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'valuation.view', userRole);
  const period = params.period ?? currentPeriod();
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const [items, total] = await Promise.all([
    CompanyValuation.find({ period }).sort({ rank: 1 }).skip((page - 1) * limit).limit(limit),
    CompanyValuation.countDocuments({ period }),
  ]);
  return { items, total, page, limit, period };
}

export async function getCompanyValuation(userId: string, companyId: string, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'valuation.view', userRole);
  const period = currentPeriod();
  let val = await CompanyValuation.findOne({ companyId, period });
  if (!val) {
    const company = await Company.findOne({ companyId, deletedAt: null });
    if (!company) throw new Error('COMPANY_NOT_FOUND');
    const state = await EconomyState.findOne({ stateId: 'ECONOMY-STATE' });
    const computed = await calculateCompanyValuation(company, period, state?.inflationRate ?? TARGET_INFLATION, state?.marketConfidence ?? 0.5);
    val = await CompanyValuation.findOneAndUpdate(
      { companyId, period },
      { valuationId: `CVAL-${companyId}-${period}`, ...computed, computedAt: new Date() },
      { upsert: true, new: true }
    );
  }
  return val;
}

export async function getDemand(userId: string, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'demand.view', userRole);
  return MarketDemand.find({ period: currentPeriod() });
}

export async function getSupply(userId: string, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'supply.view', userRole);
  return MarketSupply.find({ period: currentPeriod() });
}

export async function getAssetValuations(userId: string, params: { sector?: string; page?: number; limit?: number }, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'analytics.view', userRole);
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const filter: Record<string, unknown> = { period: currentPeriod() };
  if (params.sector) filter.sector = params.sector;
  const [items, total] = await Promise.all([
    AssetValuation.find(filter).sort({ changePercent: -1 }).skip((page - 1) * limit).limit(limit),
    AssetValuation.countDocuments(filter),
  ]);
  return { items, total, page, limit };
}

export async function getAnalytics(userId: string, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'analytics.view', userRole);
  const period = currentPeriod();
  const [gdpHistory, inflationHistory, valuations, demands, supplies] = await Promise.all([
    GDPHistory.find().sort({ recordedAt: -1 }).limit(12),
    InflationHistory.find().sort({ recordedAt: -1 }).limit(12),
    CompanyValuation.find({ period }).sort({ totalValuation: -1 }).limit(5),
    MarketDemand.find({ period }),
    MarketSupply.find({ period }),
  ]);
  return {
    gdpChart: gdpHistory.reverse().map((g) => ({ period: g.period, gdp: g.gdp, growth: g.growth })),
    inflationChart: inflationHistory.reverse().map((i) => ({ period: i.period, rate: i.rate, index: i.priceIndex })),
    topCompanies: valuations,
    sectorDemand: demands,
    sectorSupply: supplies,
    heatmap: demands.map((d) => ({
      sector: d.sector,
      demand: d.index,
      supply: supplies.find((s) => s.sector === d.sector)?.index ?? 1,
      intensity: d.index / Math.max(supplies.find((s) => s.sector === d.sector)?.index ?? 1, 0.1),
    })),
  };
}

export async function getAuditLogs(userId: string, page = 1, limit = 50, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'audit.view', userRole);
  const [items, total] = await Promise.all([
    EconomyAuditLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    EconomyAuditLog.countDocuments(),
  ]);
  return { items, total, page, limit };
}

export async function createEconomicEvent(
  userId: string,
  data: { type: string; title: string; description?: string; sector?: string; impact: number; durationHours?: number },
  userRole?: string
) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'events.create', userRole);
  const endsAt = new Date();
  endsAt.setHours(endsAt.getHours() + (data.durationHours ?? 24));
  const event = await EconomicEvent.create({
    eventId: `EVT-${uuidv4().slice(0, 8).toUpperCase()}`,
    type: data.type,
    title: data.title,
    description: data.description ?? '',
    sector: data.sector,
    impact: clamp(data.impact, -1, 1),
    durationHours: data.durationHours ?? 24,
    endsAt,
    active: true,
    createdBy: userId,
  });
  await logEconomyAction({ userId, actorId: userId, action: 'event_created', resource: 'economic_event', resourceId: event.eventId, metadata: data });
  return event;
}

export async function listEvents(userId: string, activeOnly = true, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'events.view', userRole);
  const filter: Record<string, unknown> = activeOnly ? { active: true } : {};
  return EconomicEvent.find(filter).sort({ startsAt: -1 }).limit(50);
}

export async function getBankMetrics(userId: string, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'bank.metrics.view', userRole);
  return aggregateBankMetrics();
}

export async function getRbac(userId: string, userRole?: string) {
  if (userRole !== 'admin') await assertEconomyPermission(userId, 'platform.access', userRole);
  const { ECONOMY_ROLES, DEFAULT_ECONOMY_ROLE_PERMISSIONS } = await import('../constants/economy');
  const configs = await import('../database/models/EconomyRole').then((m) => m.EconomyRoleModel.find());
  return { roles: ECONOMY_ROLES, defaults: DEFAULT_ECONOMY_ROLE_PERMISSIONS, configs };
}

function monthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
