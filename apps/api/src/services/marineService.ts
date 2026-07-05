import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { Company } from '../database/models/Company';
import { Vessel } from '../database/models/Vessel';
import { MarineDealer } from '../database/models/MarineDealer';
import { MarineInventory } from '../database/models/MarineInventory';
import { MarineSale } from '../database/models/MarineSale';
import { MarineOffer } from '../database/models/MarineOffer';
import { MarineFinance } from '../database/models/MarineFinance';
import { MarineLease } from '../database/models/MarineLease';
import { MarineAuction } from '../database/models/MarineAuction';
import { MarineMaintenance } from '../database/models/MarineMaintenance';
import { MarineInspection } from '../database/models/MarineInspection';
import { MarineAnalytics } from '../database/models/MarineAnalytics';
import { MarineAuditLog } from '../database/models/MarineAuditLog';
import { Marina } from '../database/models/Marina';
import { Port } from '../database/models/Port';
import { Dock } from '../database/models/Dock';
import {
  MARINE_APP_BUNDLE,
  MARINE_ROLES,
  DEFAULT_VESSEL_CATEGORIES,
  TAX_RATE_SALE,
  type MarineRole,
} from '../constants/marine';
import {
  seedMarineRoleConfigs,
  assertMarinePermission,
  getRolePermissions,
  updateRolePermissions,
  createDigitalSignature,
} from './marineRBACService';
import {
  logMarineAction,
  notifyMarineUser,
  currentPeriod,
  formatVessel,
  syncVesselToBusinessAsset,
  recordMarineRevenue,
  recordMarineExpense,
  transferMarineFunds,
  getWorldLocation,
} from './marineIntegrationService';
import { emitToUser } from './socketService';
import { checkPermission } from './permissionBrokerService';

function id(prefix: string) {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function generateHullReg() {
  return `GULF-${uuidv4().replace(/-/g, '').slice(0, 5).toUpperCase()}`;
}

async function getVesselOrThrow(vesselId: string) {
  const vessel = await Vessel.findOne({ vesselId, deletedAt: null });
  if (!vessel) throw new Error('VESSEL_NOT_FOUND');
  return vessel;
}

async function updateDealerAnalytics(dealerId?: string, companyId?: string) {
  const period = currentPeriod();
  const filter: Record<string, unknown> = { deletedAt: null };
  if (dealerId) filter.dealerId = dealerId;
  else if (companyId) filter.companyId = companyId;

  const vesselList = await Vessel.find(dealerId ? { dealerId, deletedAt: null } : companyId ? { companyId, deletedAt: null } : { deletedAt: null });
  const inventory = await MarineInventory.find({ ...filter, status: { $in: ['in_stock', 'reserved'] } });
  const sales = await MarineSale.find({ ...filter, status: 'completed' });
  const maintenance = await MarineMaintenance.find(dealerId ? {} : companyId ? {} : {});

  const inventoryValue = inventory.reduce((s, i) => s + i.listPrice, 0);
  const fleetValue = vesselList.reduce((s, a) => s + (a.marketValue || a.listPrice), 0);
  const totalRevenue = sales.reduce((s, sale) => s + sale.salePrice, 0);
  const maintenanceCost = maintenance.filter((m) => m.status === 'completed').reduce((s, m) => s + m.cost, 0);

  const brandSales = await MarineSale.aggregate([
    { $match: { ...filter, status: 'completed' } },
    { $lookup: { from: 'vessels', localField: 'vesselId', foreignField: 'vesselId', as: 'vessel' } },
    { $unwind: '$vessel' },
    { $group: { _id: { brand: '$vessel.brand', model: '$vessel.vesselModel' }, unitsSold: { $sum: 1 }, revenue: { $sum: '$salePrice' } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  await MarineAnalytics.findOneAndUpdate(
    { analyticsId: `AN-VS-${dealerId ?? companyId ?? 'global'}-${period}` },
    {
      analyticsId: `AN-VS-${dealerId ?? companyId ?? 'global'}-${period}`,
      dealerId,
      companyId,
      period,
      fleetCount: vesselList.length,
      fleetValue,
      totalInventory: inventory.length,
      inventoryValue,
      totalRevenue,
      maintenanceCost,
      unitsSold: sales.length,
      unitsListed: vesselList.filter((a) => a.status === 'listed' || a.status === 'featured').length,
      averageSalePrice: sales.length > 0 ? totalRevenue / sales.length : 0,
      netProfit: totalRevenue - maintenanceCost,
      bestSellers: brandSales.map((b) => ({
        vesselId: '',
        brand: b._id.brand,
        model: b._id.model,
        unitsSold: b.unitsSold,
        revenue: b.revenue,
      })),
      computedAt: new Date(),
    },
    { upsert: true }
  );
}

export async function initializeMarine(userId: string, userRole?: string) {
  await seedMarineRoleConfigs();
  const hasApp = await checkPermission(userId, MARINE_APP_BUNDLE, 'location');
  if (!hasApp && userRole !== 'admin') throw new Error('APP_NOT_INSTALLED');

  const role: MarineRole = userRole === 'admin' ? 'platform_admin' : 'buyer';
  const permissions = await getRolePermissions(role);

  emitToUser(userId, 'marine:initialized', { permissions, categories: DEFAULT_VESSEL_CATEGORIES });

  return {
    initialized: true,
    permissions,
    categories: DEFAULT_VESSEL_CATEGORIES,
    roles: MARINE_ROLES,
    ownedCount: await Vessel.countDocuments({ ownerUserId: userId, deletedAt: null }),
    favoriteCount: await Vessel.countDocuments({ favoriteUserIds: userId, deletedAt: null }),
  };
}

export async function getDashboard(userId: string, userRole?: string) {
  await assertMarinePermission(userId, 'dashboard.view', userRole);

  const featured = await Vessel.find({ isFeatured: true, status: { $in: ['listed', 'featured'] }, deletedAt: null }).limit(6);
  const dealers = await MarineDealer.find({ status: 'active', deletedAt: null }).limit(5);
  const marinas = await Marina.find({ status: 'active', deletedAt: null }).limit(5);
  const location = await getWorldLocation(userId).catch(() => null);

  return {
    featured: featured.map(formatVessel),
    dealers,
    marinas,
    stats: {
      totalVessel: await Vessel.countDocuments({ deletedAt: null }),
      totalListed: await Vessel.countDocuments({ status: { $in: ['listed', 'featured'] }, deletedAt: null }),
      forSale: await Vessel.countDocuments({ isAvailable: true, listPrice: { $gt: 0 }, deletedAt: null }),
      auctions: await MarineAuction.countDocuments({ status: 'active', deletedAt: null }),
      dealers: await MarineDealer.countDocuments({ status: 'active', deletedAt: null }),
      marinas: await Marina.countDocuments({ status: 'active', deletedAt: null }),
    },
    location,
    permissions: await getRolePermissions(userRole === 'admin' ? 'platform_admin' : 'buyer'),
  };
}

export async function listVessels(
  userId: string,
  filters: {
    page?: number; limit?: number; category?: string; brand?: string; model?: string;
    manufacturer?: string; minPrice?: number; maxPrice?: number; maxEngineHours?: number;
    engineType?: string; minPassengers?: number; minCargo?: number;
    dealerId?: string; companyId?: string; marinaId?: string; dockId?: string;
    isFeatured?: boolean; isAvailable?: boolean;
  },
  userRole?: string
) {
  await assertMarinePermission(userId, 'vessels.view', userRole);
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 20, 100);
  const query: Record<string, unknown> = { deletedAt: null };

  if (filters.category) query.category = filters.category;
  if (filters.brand) query.brand = new RegExp(filters.brand, 'i');
  if (filters.model) query.vesselModel = new RegExp(filters.model, 'i');
  if (filters.manufacturer) query.manufacturer = new RegExp(filters.manufacturer, 'i');
  if (filters.dealerId) query.dealerId = filters.dealerId;
  if (filters.companyId) query.companyId = filters.companyId;
  if (filters.marinaId) query.currentMarinaId = filters.marinaId;
  if (filters.dockId) query.currentDockId = filters.dockId;
  if (filters.isFeatured !== undefined) query.isFeatured = filters.isFeatured;
  if (filters.isAvailable !== undefined) query.isAvailable = filters.isAvailable;
  if (filters.maxEngineHours) query['specs.engineHours'] = { $lte: filters.maxEngineHours };
  if (filters.engineType) query['specs.engineType'] = filters.engineType;
  if (filters.minPassengers) query['specs.passengerCapacity'] = { $gte: filters.minPassengers };
  if (filters.minCargo) query['specs.cargoCapacity'] = { $gte: filters.minCargo };
  if (filters.minPrice || filters.maxPrice) {
    query.listPrice = {};
    if (filters.minPrice) (query.listPrice as Record<string, number>).$gte = filters.minPrice;
    if (filters.maxPrice) (query.listPrice as Record<string, number>).$lte = filters.maxPrice;
  }

  const [items, total] = await Promise.all([
    Vessel.find(query).sort({ isFeatured: -1, updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
    Vessel.countDocuments(query),
  ]);

  return { items: items.map(formatVessel), total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getVessel(userId: string, vesselId: string, userRole?: string) {
  await assertMarinePermission(userId, 'vessels.view', userRole);
  const vessel = await getVesselOrThrow(vesselId);
  vessel.viewCount += 1;
  await vessel.save();
  return formatVessel(vessel);
}

export async function createVessel(userId: string, data: Record<string, unknown>, userRole?: string, meta?: { ipAddress?: string; deviceUuid?: string }) {
  await assertMarinePermission(userId, 'vessels.create', userRole);

  const vesselId = id('AC');
  const count = await Vessel.countDocuments();

  const vessel = await Vessel.create({
    vesselId,
    registrationNumber: data.registrationNumber ?? generateHullReg(),
    serialNumber: data.serialNumber ?? `SN-${vesselId}`,
    manufacturer: data.manufacturer ?? data.brand,
    brand: data.brand,
    vesselModel: data.model,
    variant: data.variant,
    year: data.year,
    category: data.category,
    engineHours: data.engineHours ?? 0,
    specs: data.specs ?? {},
    color: data.color ?? '',
    interior: data.interior ?? '',
    listPrice: data.listPrice ?? 0,
    dealerPrice: data.dealerPrice,
    marketValue: data.marketValue ?? data.listPrice ?? 0,
    status: 'pending',
    ownerUserId: new Types.ObjectId(userId),
    companyId: data.companyId,
    dealerId: data.dealerId,
    location: data.location,
    currentMarinaId: data.marinaId,
    currentDockId: data.dockId,
    createdBy: new Types.ObjectId(userId),
  });

  if (data.dealerId && data.companyId) {
    const inv = await MarineInventory.create({
      inventoryId: id('INV'),
      dealerId: data.dealerId as string,
      companyId: data.companyId as string,
      vesselId,
      acquisitionCost: (data.dealerPrice as number) ?? (data.listPrice as number) ?? 0,
      listPrice: (data.listPrice as number) ?? 0,
      marinaId: data.marinaId as string,
      dockId: data.dockId as string,
      createdBy: new Types.ObjectId(userId),
    });
    vessel.inventoryId = inv.inventoryId;
    await vessel.save();
    await MarineDealer.updateOne({ dealerId: data.dealerId }, { $inc: { inventoryCount: 1, fleetCount: 1 } });
  }

  if (vessel.companyId) await syncVesselToBusinessAsset(vessel, userId);

  await logMarineAction({
    vesselId, dealerId: vessel.dealerId, userId, actorId: userId,
    action: 'vessel_created', resource: 'vessel', resourceId: vesselId,
    ipAddress: meta?.ipAddress, deviceUuid: meta?.deviceUuid,
  });

  emitToUser(userId, 'marine:listed', { vessel: formatVessel(vessel) });
  return formatVessel(vessel);
}

export async function updateVessel(userId: string, vesselId: string, updates: Record<string, unknown>, userRole?: string) {
  await assertMarinePermission(userId, 'vessels.manage', userRole);
  const vessel = await Vessel.findOneAndUpdate(
    { vesselId, deletedAt: null },
    { ...updates, updatedBy: new Types.ObjectId(userId) },
    { new: true }
  );
  if (!vessel) throw new Error('VESSEL_NOT_FOUND');

  if (updates.listPrice !== undefined) {
    emitToUser(userId, 'marine:price:change', { vesselId, listPrice: vessel.listPrice });
  }

  if (vessel.companyId) await syncVesselToBusinessAsset(vessel, userId);
  return formatVessel(vessel);
}

export async function listVesselForSale(userId: string, vesselId: string, userRole?: string) {
  await assertMarinePermission(userId, 'vessels.approve', userRole);
  const vessel = await Vessel.findOneAndUpdate(
    { vesselId, deletedAt: null },
    { status: 'listed', isAvailable: true, updatedBy: new Types.ObjectId(userId) },
    { new: true }
  );
  if (!vessel) throw new Error('VESSEL_NOT_FOUND');
  emitToUser(userId, 'marine:listed', { vessel: formatVessel(vessel) });
  return formatVessel(vessel);
}

export async function reserveVessel(userId: string, vesselId: string, hours = 72, userRole?: string) {
  await assertMarinePermission(userId, 'inventory.reserve', userRole);
  const vessel = await getVesselOrThrow(vesselId);
  vessel.status = 'reserved';
  vessel.isAvailable = false;
  await vessel.save();

  const inv = await MarineInventory.findOne({ vesselId, deletedAt: null });
  if (inv) {
    inv.status = 'reserved';
    inv.reservedBy = new Types.ObjectId(userId);
    inv.reservedUntil = new Date(Date.now() + hours * 3600000);
    await inv.save();
  }

  emitToUser(userId, 'marine:reserved', { vesselId, reservedUntil: inv?.reservedUntil });
  return { vesselId, reservedUntil: inv?.reservedUntil };
}

export async function moveVessel(
  userId: string,
  vesselId: string,
  data: { marinaId?: string; dockId?: string; latitude?: number; longitude?: number },
  userRole?: string
) {
  await assertMarinePermission(userId, 'vessels.move', userRole);
  const vessel = await getVesselOrThrow(vesselId);

  if (data.marinaId) vessel.currentMarinaId = data.marinaId;
  if (data.dockId) vessel.currentDockId = data.dockId;
  if (data.latitude !== undefined && data.longitude !== undefined) {
    vessel.location = { ...vessel.location, latitude: data.latitude, longitude: data.longitude, marinaId: data.marinaId, dockId: data.dockId };
  }
  vessel.status = 'in_transit';
  await vessel.save();

  emitToUser(userId, 'marine:location:change', { vesselId, marinaId: data.marinaId, dockId: data.dockId });
  return formatVessel(vessel);
}

// Dealers
export async function createDealer(userId: string, data: { companyId: string; name: string; tradeName: string; licenseNumber: string; address: string; city: string; district: string; phone: string; email: string; homeMarinaId?: string }, userRole?: string) {
  await assertMarinePermission(userId, 'dealers.create', userRole);
  const company = await Company.findOne({ companyId: data.companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');

  const dealer = await MarineDealer.create({
    dealerId: id('DLR'),
    ...data,
    ownerUserId: new Types.ObjectId(userId),
    iban: company.iban,
    categories: DEFAULT_VESSEL_CATEGORIES as unknown as string[],
    createdBy: new Types.ObjectId(userId),
  });
  return dealer;
}

export async function listDealers(userId: string, userRole?: string) {
  await assertMarinePermission(userId, 'dealers.view', userRole);
  return MarineDealer.find({ deletedAt: null, status: 'active' }).sort({ name: 1 });
}

export async function getDealerFleet(userId: string, dealerId: string, userRole?: string) {
  await assertMarinePermission(userId, 'fleet.view', userRole);
  const inventory = await MarineInventory.find({ dealerId, deletedAt: null });
  const vesselList = await Vessel.find({ dealerId, deletedAt: null });
  return { inventory, fleet: vesselList.map(formatVessel) };
}

// Marinas & Infrastructure
export async function createMarina(userId: string, data: Record<string, unknown>, userRole?: string) {
  await assertMarinePermission(userId, 'marinas.create', userRole);
  const marina = await Marina.create({
    marinaId: id('MRN'),
    code: data.code ?? `GULF${String(await Marina.countDocuments() + 1).padStart(3, '0')}`,
    name: data.name,
    type: data.type ?? 'marina',
    city: data.city,
    district: data.district,
    country: data.country ?? 'GULF',
    latitude: data.latitude,
    longitude: data.longitude,
    hasFuelStation: data.hasFuelStation ?? false,
    hasMaintenance: data.hasMaintenance ?? false,
    hasBoatStorage: data.hasBoatStorage ?? false,
    isGovernment: data.isGovernment ?? false,
    isMilitary: data.isMilitary ?? false,
    companyId: data.companyId,
    ownerUserId: new Types.ObjectId(userId),
    createdBy: new Types.ObjectId(userId),
  });
  return marina;
}

export async function listMarinas(userId: string, filters: { type?: string; city?: string; companyId?: string }, userRole?: string) {
  await assertMarinePermission(userId, 'marinas.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null, status: 'active' };
  if (filters.type) query.type = filters.type;
  if (filters.city) query.city = new RegExp(filters.city, 'i');
  if (filters.companyId) query.companyId = filters.companyId;
  return Marina.find(query).sort({ name: 1 });
}

export async function getMarina(userId: string, marinaId: string, userRole?: string) {
  await assertMarinePermission(userId, 'marinas.view', userRole);
  const marina = await Marina.findOne({ marinaId, deletedAt: null });
  if (!marina) throw new Error('MARINA_NOT_FOUND');
  const [docks, vesselsAtMarina] = await Promise.all([
    Dock.find({ marinaId, deletedAt: null }),
    Vessel.find({ currentMarinaId: marinaId, deletedAt: null }).limit(20),
  ]);
  return { marina, docks, vessels: vesselsAtMarina.map(formatVessel) };
}

export async function createDock(userId: string, data: Record<string, unknown>, userRole?: string) {
  await assertMarinePermission(userId, 'docks.create', userRole);
  const dock = await Dock.create({
    dockId: id('DCK'),
    marinaId: data.marinaId,
    name: data.name,
    type: data.type ?? 'commercial',
    capacity: data.capacity ?? 1,
    length: data.length ?? 0,
    depth: data.depth ?? 0,
    companyId: data.companyId,
    ownerUserId: new Types.ObjectId(userId),
    monthlyRate: data.monthlyRate ?? 0,
    hasPower: data.hasPower ?? true,
    hasWater: data.hasWater ?? true,
    createdBy: new Types.ObjectId(userId),
  });
  await Marina.updateOne({ marinaId: data.marinaId }, { $inc: { dockCount: 1 } });
  return dock;
}

export async function createPort(userId: string, data: Record<string, unknown>, userRole?: string) {
  await assertMarinePermission(userId, 'ports.create', userRole);
  const port = await Port.create({
    portId: id('PRT'),
    code: data.code ?? `GULF${String(await Port.countDocuments() + 1).padStart(3, '0')}`,
    name: data.name,
    type: data.type ?? 'commercial',
    city: data.city,
    district: data.district,
    country: data.country ?? 'GULF',
    latitude: data.latitude,
    longitude: data.longitude,
    berthCount: data.berthCount ?? 0,
    maxVesselLength: data.maxVesselLength ?? 0,
    maxDraft: data.maxDraft ?? 0,
    hasFuelStation: data.hasFuelStation ?? false,
    hasShipyard: data.hasShipyard ?? false,
    companyId: data.companyId,
    createdBy: new Types.ObjectId(userId),
  });
  return port;
}

// Offers
export async function createOffer(userId: string, data: { vesselId: string; amount: number; message?: string; tradeInVesselId?: string; tradeInValue?: number }, userRole?: string) {
  await assertMarinePermission(userId, 'offers.create', userRole);
  const vessel = await getVesselOrThrow(data.vesselId);

  const offer = await MarineOffer.create({
    offerId: id('OFF'),
    vesselId: data.vesselId,
    buyerUserId: new Types.ObjectId(userId),
    sellerUserId: vessel.ownerUserId,
    dealerId: vessel.dealerId,
    companyId: vessel.companyId,
    amount: data.amount,
    tradeInVesselId: data.tradeInVesselId,
    tradeInValue: data.tradeInValue,
    message: data.message,
    expiresAt: new Date(Date.now() + 14 * 24 * 3600000),
    createdBy: new Types.ObjectId(userId),
  });

  vessel.status = 'under_offer';
  await vessel.save();

  if (vessel.ownerUserId) {
    await notifyMarineUser(vessel.ownerUserId.toString(), 'New Vessel Offer', `₴${data.amount} offer on ${vessel.brand} ${vessel.vesselModel}`);
    emitToUser(vessel.ownerUserId.toString(), 'marine:offer:received', { offerId: offer.offerId, amount: data.amount });
  }
  return offer;
}

export async function acceptOffer(userId: string, offerId: string, userRole?: string) {
  await assertMarinePermission(userId, 'offers.manage', userRole);
  const offer = await MarineOffer.findOne({ offerId, deletedAt: null });
  if (!offer) throw new Error('OFFER_NOT_FOUND');
  offer.status = 'accepted';
  await offer.save();
  emitToUser(offer.buyerUserId.toString(), 'marine:offer:accepted', { offerId });
  return completeSale(userId, offer.vesselId, offer.buyerUserId.toString(), offer.amount, 'cash', userRole, offer.offerId);
}

export async function counterOffer(userId: string, offerId: string, counterAmount: number, message?: string, userRole?: string) {
  await assertMarinePermission(userId, 'offers.negotiate', userRole);
  const offer = await MarineOffer.findOne({ offerId, deletedAt: null });
  if (!offer) throw new Error('OFFER_NOT_FOUND');
  offer.status = 'countered';
  offer.counterAmount = counterAmount;
  offer.counterBy = new Types.ObjectId(userId);
  offer.negotiationHistory.push({ amount: counterAmount, by: new Types.ObjectId(userId), message, at: new Date() });
  await offer.save();
  emitToUser(offer.buyerUserId.toString(), 'marine:offer:received', { offerId, counterAmount });
  return offer;
}

export async function listOffers(userId: string, vesselId?: string, userRole?: string) {
  await assertMarinePermission(userId, 'offers.view', userRole);
  const filter: Record<string, unknown> = { deletedAt: null };
  if (vesselId) filter.vesselId = vesselId;
  return MarineOffer.find(filter).sort({ createdAt: -1 }).limit(50);
}

// Sales
export async function completeSale(
  userId: string,
  vesselId: string,
  buyerUserId: string,
  salePrice: number,
  paymentType: 'cash' | 'installment' | 'bank_financing' | 'leasing' | 'trade_in',
  userRole?: string,
  offerId?: string
) {
  await assertMarinePermission(userId, 'sales.manage', userRole);
  const vessel = await getVesselOrThrow(vesselId);
  const taxAmount = salePrice * TAX_RATE_SALE;
  const commission = salePrice * 0.04;

  const sale = await MarineSale.create({
    saleId: id('SALE'),
    vesselId,
    offerId,
    buyerUserId: new Types.ObjectId(buyerUserId),
    sellerUserId: vessel.ownerUserId!,
    dealerId: vessel.dealerId,
    companyId: vessel.companyId,
    salePrice,
    taxAmount,
    commission,
    paymentType,
    status: 'in_escrow',
    createdBy: new Types.ObjectId(userId),
  });

  const netAmount = salePrice - taxAmount - commission;
  if (vessel.companyId) {
    await transferMarineFunds(undefined, vessel.companyId, netAmount, `Vessel sale ${vessel.brand} ${vessel.vesselModel}`, sale.saleId);
    await recordMarineRevenue(vessel.companyId, vesselId, netAmount, userId);
  }

  vessel.status = 'sold';
  vessel.isAvailable = false;
  vessel.ownerUserId = new Types.ObjectId(buyerUserId);
  await vessel.save();

  const inv = await MarineInventory.findOne({ vesselId, deletedAt: null });
  if (inv) {
    inv.status = 'sold';
    inv.soldAt = new Date();
    await inv.save();
    if (vessel.dealerId) await MarineDealer.updateOne({ dealerId: vessel.dealerId }, { $inc: { inventoryCount: -1 } });
  }

  sale.status = 'completed';
  sale.completedAt = new Date();
  sale.signatureHash = createDigitalSignature(userId, sale.saleId);
  await sale.save();

  emitToUser(buyerUserId, 'marine:sold', { vesselId, saleId: sale.saleId });
  await updateDealerAnalytics(vessel.dealerId, vessel.companyId);
  emitToUser(userId, 'marine:analytics:update', { dealerId: vessel.dealerId });
  return sale;
}

export async function listSales(userId: string, dealerId?: string, userRole?: string) {
  await assertMarinePermission(userId, 'sales.view', userRole);
  const filter: Record<string, unknown> = { deletedAt: null };
  if (dealerId) filter.dealerId = dealerId;
  return MarineSale.find(filter).sort({ createdAt: -1 }).limit(50);
}

// Finance & Leasing
export async function createFinance(userId: string, data: { vesselId: string; type: 'installment' | 'bank_financing' | 'leasing'; principal: number; downPayment: number; interestRate: number; termMonths: number; lender: string }, userRole?: string) {
  await assertMarinePermission(userId, 'finance.create', userRole);
  const monthlyRate = data.interestRate / 100 / 12;
  const financed = data.principal - data.downPayment;
  const monthlyPayment = financed * (monthlyRate * Math.pow(1 + monthlyRate, data.termMonths)) / (Math.pow(1 + monthlyRate, data.termMonths) - 1);

  const finance = await MarineFinance.create({
    financeId: id('FIN'),
    vesselId: data.vesselId,
    buyerUserId: new Types.ObjectId(userId),
    type: data.type,
    principal: data.principal,
    downPayment: data.downPayment,
    interestRate: data.interestRate,
    termMonths: data.termMonths,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    remainingBalance: financed,
    lender: data.lender,
    status: 'pending',
    createdBy: new Types.ObjectId(userId),
  });

  emitToUser(userId, 'marine:finance:update', { financeId: finance.financeId });
  return finance;
}

export async function createLease(userId: string, data: { vesselId: string; lessorCompanyId: string; monthlyRate: number; termMonths: number; securityDeposit?: number }, userRole?: string) {
  await assertMarinePermission(userId, 'finance.leasing', userRole);
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + data.termMonths * 30 * 24 * 3600000);

  const lease = await MarineLease.create({
    leaseId: id('LSE'),
    vesselId: data.vesselId,
    lessorCompanyId: data.lessorCompanyId,
    lesseeUserId: new Types.ObjectId(userId),
    monthlyRate: data.monthlyRate,
    securityDeposit: data.securityDeposit ?? 0,
    termMonths: data.termMonths,
    startDate,
    endDate,
    status: 'active',
    createdBy: new Types.ObjectId(userId),
  });

  const vessel = await getVesselOrThrow(data.vesselId);
  vessel.status = 'leased';
  vessel.isAvailable = false;
  await vessel.save();

  emitToUser(userId, 'marine:leased', { vesselId: data.vesselId, leaseId: lease.leaseId });
  return lease;
}

export async function listFinance(userId: string, userRole?: string) {
  await assertMarinePermission(userId, 'finance.view', userRole);
  return MarineFinance.find({ buyerUserId: userId, deletedAt: null }).sort({ createdAt: -1 });
}

export async function listLeases(userId: string, userRole?: string) {
  await assertMarinePermission(userId, 'finance.view', userRole);
  return MarineLease.find({ lesseeUserId: userId, deletedAt: null }).sort({ createdAt: -1 });
}

// Auctions
export async function createAuction(userId: string, data: { vesselId: string; startingBid: number; reservePrice?: number; buyNowPrice?: number; durationHours: number }, userRole?: string) {
  await assertMarinePermission(userId, 'auctions.create', userRole);
  const vessel = await getVesselOrThrow(data.vesselId);

  const auction = await MarineAuction.create({
    auctionId: id('AUC'),
    vesselId: data.vesselId,
    dealerId: vessel.dealerId,
    companyId: vessel.companyId,
    startingBid: data.startingBid,
    currentBid: data.startingBid,
    reservePrice: data.reservePrice,
    buyNowPrice: data.buyNowPrice,
    status: 'active',
    startsAt: new Date(),
    endsAt: new Date(Date.now() + data.durationHours * 3600000),
    createdBy: new Types.ObjectId(userId),
  });

  vessel.status = 'in_auction';
  await vessel.save();

  emitToUser(userId, 'marine:auction:started', { auctionId: auction.auctionId, vesselId: data.vesselId });
  return auction;
}

export async function placeBid(userId: string, auctionId: string, amount: number, userRole?: string) {
  await assertMarinePermission(userId, 'auctions.bid', userRole);
  const auction = await MarineAuction.findOne({ auctionId, status: 'active', deletedAt: null });
  if (!auction) throw new Error('AUCTION_NOT_FOUND');
  if (amount <= auction.currentBid) throw new Error('BID_TOO_LOW');

  auction.currentBid = amount;
  auction.highestBidderId = new Types.ObjectId(userId);
  auction.bidCount += 1;
  auction.bids.push({ bidId: id('BID'), bidderId: new Types.ObjectId(userId), amount, placedAt: new Date() });
  await auction.save();

  emitToUser(userId, 'marine:auction:started', { auctionId, currentBid: amount });
  return auction;
}

export async function listAuctions(userId: string, userRole?: string) {
  await assertMarinePermission(userId, 'auctions.view', userRole);
  return MarineAuction.find({ status: 'active', deletedAt: null }).sort({ endsAt: 1 });
}

// Maintenance
export async function createMaintenance(userId: string, data: Record<string, unknown>, userRole?: string) {
  await assertMarinePermission(userId, 'maintenance.create', userRole);
  const maintenance = await MarineMaintenance.create({
    maintenanceId: id('MAINT'),
    vesselId: data.vesselId,
    type: data.type ?? 'service',
    title: data.title,
    description: data.description ?? '',
    cost: data.cost ?? 0,
    engineHours: data.engineHours ?? 0,
    mechanicUserId: data.mechanicUserId ? new Types.ObjectId(data.mechanicUserId as string) : undefined,
    marinaId: data.marinaId,
    status: 'completed',
    requestedBy: new Types.ObjectId(userId),
    completedAt: new Date(),
    createdBy: new Types.ObjectId(userId),
  });

  const vessel = await Vessel.findOne({ vesselId: data.vesselId as string });
  if (vessel) {
    vessel.repairHistory.push({
      repairId: maintenance.maintenanceId,
      description: data.title as string,
      cost: data.cost as number ?? 0,
      engineHoursAtRepair: data.engineHours as number ?? vessel.specs?.engineHours ?? 0,
      performedAt: new Date(),
    });
    await vessel.save();
    if (vessel.companyId && (data.cost as number) > 0) {
      await recordMarineExpense(vessel.companyId, vessel.vesselId, data.cost as number, 'maintenance', userId);
      await MarineDealer.updateOne({ dealerId: vessel.dealerId }, { $inc: { maintenanceCost: data.cost as number } });
    }
  }

  emitToUser(userId, 'marine:maintenance', { maintenanceId: maintenance.maintenanceId, vesselId: data.vesselId });
  return maintenance;
}

export async function scheduleInspection(userId: string, data: Record<string, unknown>, userRole?: string) {
  await assertMarinePermission(userId, 'inspections.schedule', userRole);
  return MarineInspection.create({
    inspectionId: id('INSP'),
    vesselId: data.vesselId,
    type: data.type ?? 'annual',
    inspectorUserId: new Types.ObjectId(userId),
    scheduledAt: new Date(data.scheduledAt as string),
    engineHoursAtInspection: data.engineHours as number ?? 0,
    findings: '',
    createdBy: new Types.ObjectId(userId),
  });
}

// Search
export async function searchVessels(userId: string, params: Record<string, unknown>, userRole?: string) {
  await assertMarinePermission(userId, 'search.advanced', userRole);
  if (params.registration) {
    const vessel = await Vessel.findOne({ registrationNumber: new RegExp(String(params.registration), 'i'), deletedAt: null });
    return vessel ? [formatVessel(vessel)] : [];
  }
  const result = await listVessels(userId, params as never, userRole);
  return result.items;
}

// Favorites
export async function toggleFavorite(userId: string, vesselId: string, userRole?: string) {
  await assertMarinePermission(userId, 'favorites.manage', userRole);
  const vessel = await getVesselOrThrow(vesselId);
  const isFav = vessel.favoriteUserIds.some((uid) => uid.toString() === userId);
  if (isFav) {
    vessel.favoriteUserIds = vessel.favoriteUserIds.filter((uid) => uid.toString() !== userId);
  } else {
    vessel.favoriteUserIds.push(new Types.ObjectId(userId));
  }
  await vessel.save();
  return { favorited: !isFav, vesselId };
}

export async function listFavorites(userId: string, userRole?: string) {
  await assertMarinePermission(userId, 'favorites.manage', userRole);
  const vesselList = await Vessel.find({ favoriteUserIds: userId, deletedAt: null });
  return vesselList.map(formatVessel);
}

// Analytics
export async function getAnalytics(userId: string, dealerId?: string, companyId?: string, userRole?: string) {
  await assertMarinePermission(userId, 'analytics.view', userRole);
  await updateDealerAnalytics(dealerId, companyId);
  const filter: Record<string, unknown> = { period: currentPeriod() };
  if (dealerId) filter.dealerId = dealerId;
  else if (companyId) filter.companyId = companyId;
  return MarineAnalytics.findOne(filter);
}

// RBAC & Audit
export async function getRbac(userId: string, userRole?: string) {
  await assertMarinePermission(userId, 'rbac.configure', userRole);
  return Promise.all(MARINE_ROLES.map(async (role) => ({ role, permissions: await getRolePermissions(role) })));
}

export async function updateRbac(userId: string, role: MarineRole, permissions: string[], userRole?: string) {
  await assertMarinePermission(userId, 'rbac.configure', userRole);
  return updateRolePermissions(role, permissions as never, userId);
}

export async function getAuditLogs(userId: string, vesselId?: string, userRole?: string) {
  await assertMarinePermission(userId, 'audit.view', userRole);
  const filter: Record<string, unknown> = {};
  if (vesselId) filter.vesselId = vesselId;
  return MarineAuditLog.find(filter).sort({ createdAt: -1 }).limit(100);
}

export { createDigitalSignature };
