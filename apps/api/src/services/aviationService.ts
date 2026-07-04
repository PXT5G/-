import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { Company } from '../database/models/Company';
import { Aircraft } from '../database/models/Aircraft';
import { AircraftDealer } from '../database/models/AircraftDealer';
import { AircraftInventory } from '../database/models/AircraftInventory';
import { AircraftSale } from '../database/models/AircraftSale';
import { AircraftOffer } from '../database/models/AircraftOffer';
import { AircraftFinance } from '../database/models/AircraftFinance';
import { AircraftLease } from '../database/models/AircraftLease';
import { AircraftAuction } from '../database/models/AircraftAuction';
import { AircraftMaintenance } from '../database/models/AircraftMaintenance';
import { AircraftInspection } from '../database/models/AircraftInspection';
import { AircraftAnalytics } from '../database/models/AircraftAnalytics';
import { AircraftAuditLog } from '../database/models/AircraftAuditLog';
import { Airport } from '../database/models/Airport';
import { Runway } from '../database/models/Runway';
import { AircraftHangar } from '../database/models/AircraftHangar';
import {
  AVIATION_APP_BUNDLE,
  AVIATION_ROLES,
  DEFAULT_AIRCRAFT_CATEGORIES,
  TAX_RATE_SALE,
  type AviationRole,
} from '../constants/aviation';
import {
  seedAviationRoleConfigs,
  assertAviationPermission,
  getRolePermissions,
  updateRolePermissions,
  createDigitalSignature,
} from './aviationRBACService';
import {
  logAviationAction,
  notifyAviationUser,
  currentPeriod,
  formatAircraft,
  syncAircraftToBusinessAsset,
  recordAircraftRevenue,
  recordAircraftExpense,
  transferAircraftFunds,
  getWorldLocation,
} from './aviationIntegrationService';
import { emitToUser } from './socketService';
import { checkPermission } from './permissionBrokerService';

function id(prefix: string) {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function generateRegistration() {
  return `GULF-${uuidv4().replace(/-/g, '').slice(0, 5).toUpperCase()}`;
}

async function getAircraftOrThrow(aircraftId: string) {
  const aircraft = await Aircraft.findOne({ aircraftId, deletedAt: null });
  if (!aircraft) throw new Error('AIRCRAFT_NOT_FOUND');
  return aircraft;
}

async function updateDealerAnalytics(dealerId?: string, companyId?: string) {
  const period = currentPeriod();
  const filter: Record<string, unknown> = { deletedAt: null };
  if (dealerId) filter.dealerId = dealerId;
  else if (companyId) filter.companyId = companyId;

  const aircraftList = await Aircraft.find(dealerId ? { dealerId, deletedAt: null } : companyId ? { companyId, deletedAt: null } : { deletedAt: null });
  const inventory = await AircraftInventory.find({ ...filter, status: { $in: ['in_stock', 'reserved'] } });
  const sales = await AircraftSale.find({ ...filter, status: 'completed' });
  const maintenance = await AircraftMaintenance.find(dealerId ? {} : companyId ? {} : {});

  const inventoryValue = inventory.reduce((s, i) => s + i.listPrice, 0);
  const fleetValue = aircraftList.reduce((s, a) => s + (a.marketValue || a.listPrice), 0);
  const totalRevenue = sales.reduce((s, sale) => s + sale.salePrice, 0);
  const maintenanceCost = maintenance.filter((m) => m.status === 'completed').reduce((s, m) => s + m.cost, 0);

  const brandSales = await AircraftSale.aggregate([
    { $match: { ...filter, status: 'completed' } },
    { $lookup: { from: 'aircrafts', localField: 'aircraftId', foreignField: 'aircraftId', as: 'aircraft' } },
    { $unwind: '$aircraft' },
    { $group: { _id: { brand: '$aircraft.brand', model: '$aircraft.aircraftModel' }, unitsSold: { $sum: 1 }, revenue: { $sum: '$salePrice' } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  await AircraftAnalytics.findOneAndUpdate(
    { analyticsId: `AN-AC-${dealerId ?? companyId ?? 'global'}-${period}` },
    {
      analyticsId: `AN-AC-${dealerId ?? companyId ?? 'global'}-${period}`,
      dealerId,
      companyId,
      period,
      fleetCount: aircraftList.length,
      fleetValue,
      totalInventory: inventory.length,
      inventoryValue,
      totalRevenue,
      maintenanceCost,
      unitsSold: sales.length,
      unitsListed: aircraftList.filter((a) => a.status === 'listed' || a.status === 'featured').length,
      averageSalePrice: sales.length > 0 ? totalRevenue / sales.length : 0,
      netProfit: totalRevenue - maintenanceCost,
      bestSellers: brandSales.map((b) => ({
        aircraftId: '',
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

export async function initializeAviation(userId: string, userRole?: string) {
  await seedAviationRoleConfigs();
  const hasApp = await checkPermission(userId, AVIATION_APP_BUNDLE, 'location');
  if (!hasApp && userRole !== 'admin') throw new Error('APP_NOT_INSTALLED');

  const role: AviationRole = userRole === 'admin' ? 'platform_admin' : 'buyer';
  const permissions = await getRolePermissions(role);

  emitToUser(userId, 'aviation:initialized', { permissions, categories: DEFAULT_AIRCRAFT_CATEGORIES });

  return {
    initialized: true,
    permissions,
    categories: DEFAULT_AIRCRAFT_CATEGORIES,
    roles: AVIATION_ROLES,
    ownedCount: await Aircraft.countDocuments({ ownerUserId: userId, deletedAt: null }),
    favoriteCount: await Aircraft.countDocuments({ favoriteUserIds: userId, deletedAt: null }),
  };
}

export async function getDashboard(userId: string, userRole?: string) {
  await assertAviationPermission(userId, 'dashboard.view', userRole);

  const featured = await Aircraft.find({ isFeatured: true, status: { $in: ['listed', 'featured'] }, deletedAt: null }).limit(6);
  const dealers = await AircraftDealer.find({ status: 'active', deletedAt: null }).limit(5);
  const airports = await Airport.find({ status: 'active', deletedAt: null }).limit(5);
  const location = await getWorldLocation(userId).catch(() => null);

  return {
    featured: featured.map(formatAircraft),
    dealers,
    airports,
    stats: {
      totalAircraft: await Aircraft.countDocuments({ deletedAt: null }),
      totalListed: await Aircraft.countDocuments({ status: { $in: ['listed', 'featured'] }, deletedAt: null }),
      forSale: await Aircraft.countDocuments({ isAvailable: true, listPrice: { $gt: 0 }, deletedAt: null }),
      auctions: await AircraftAuction.countDocuments({ status: 'active', deletedAt: null }),
      dealers: await AircraftDealer.countDocuments({ status: 'active', deletedAt: null }),
      airports: await Airport.countDocuments({ status: 'active', deletedAt: null }),
    },
    location,
    permissions: await getRolePermissions(userRole === 'admin' ? 'platform_admin' : 'buyer'),
  };
}

export async function listAircraft(
  userId: string,
  filters: {
    page?: number; limit?: number; category?: string; brand?: string; model?: string;
    manufacturer?: string; minPrice?: number; maxPrice?: number; maxFlightHours?: number;
    engineType?: string; minPassengers?: number; minCargo?: number;
    dealerId?: string; companyId?: string; airportId?: string; hangarId?: string;
    isFeatured?: boolean; isAvailable?: boolean;
  },
  userRole?: string
) {
  await assertAviationPermission(userId, 'aircraft.view', userRole);
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 20, 100);
  const query: Record<string, unknown> = { deletedAt: null };

  if (filters.category) query.category = filters.category;
  if (filters.brand) query.brand = new RegExp(filters.brand, 'i');
  if (filters.model) query.aircraftModel = new RegExp(filters.model, 'i');
  if (filters.manufacturer) query.manufacturer = new RegExp(filters.manufacturer, 'i');
  if (filters.dealerId) query.dealerId = filters.dealerId;
  if (filters.companyId) query.companyId = filters.companyId;
  if (filters.airportId) query.currentAirportId = filters.airportId;
  if (filters.hangarId) query.currentHangarId = filters.hangarId;
  if (filters.isFeatured !== undefined) query.isFeatured = filters.isFeatured;
  if (filters.isAvailable !== undefined) query.isAvailable = filters.isAvailable;
  if (filters.maxFlightHours) query.flightHours = { $lte: filters.maxFlightHours };
  if (filters.engineType) query['specs.engineType'] = filters.engineType;
  if (filters.minPassengers) query['specs.passengerCapacity'] = { $gte: filters.minPassengers };
  if (filters.minCargo) query['specs.cargoCapacity'] = { $gte: filters.minCargo };
  if (filters.minPrice || filters.maxPrice) {
    query.listPrice = {};
    if (filters.minPrice) (query.listPrice as Record<string, number>).$gte = filters.minPrice;
    if (filters.maxPrice) (query.listPrice as Record<string, number>).$lte = filters.maxPrice;
  }

  const [items, total] = await Promise.all([
    Aircraft.find(query).sort({ isFeatured: -1, updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
    Aircraft.countDocuments(query),
  ]);

  return { items: items.map(formatAircraft), total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getAircraft(userId: string, aircraftId: string, userRole?: string) {
  await assertAviationPermission(userId, 'aircraft.view', userRole);
  const aircraft = await getAircraftOrThrow(aircraftId);
  aircraft.viewCount += 1;
  await aircraft.save();
  return formatAircraft(aircraft);
}

export async function createAircraft(userId: string, data: Record<string, unknown>, userRole?: string, meta?: { ipAddress?: string; deviceUuid?: string }) {
  await assertAviationPermission(userId, 'aircraft.create', userRole);

  const aircraftId = id('AC');
  const count = await Aircraft.countDocuments();

  const aircraft = await Aircraft.create({
    aircraftId,
    registrationNumber: data.registrationNumber ?? generateRegistration(),
    serialNumber: data.serialNumber ?? `SN-${aircraftId}`,
    manufacturer: data.manufacturer ?? data.brand,
    brand: data.brand,
    aircraftModel: data.model,
    variant: data.variant,
    year: data.year,
    category: data.category,
    flightHours: data.flightHours ?? 0,
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
    currentAirportId: data.airportId,
    currentHangarId: data.hangarId,
    createdBy: new Types.ObjectId(userId),
  });

  if (data.dealerId && data.companyId) {
    const inv = await AircraftInventory.create({
      inventoryId: id('INV'),
      dealerId: data.dealerId as string,
      companyId: data.companyId as string,
      aircraftId,
      acquisitionCost: (data.dealerPrice as number) ?? (data.listPrice as number) ?? 0,
      listPrice: (data.listPrice as number) ?? 0,
      airportId: data.airportId as string,
      hangarId: data.hangarId as string,
      createdBy: new Types.ObjectId(userId),
    });
    aircraft.inventoryId = inv.inventoryId;
    await aircraft.save();
    await AircraftDealer.updateOne({ dealerId: data.dealerId }, { $inc: { inventoryCount: 1, fleetCount: 1 } });
  }

  if (aircraft.companyId) await syncAircraftToBusinessAsset(aircraft, userId);

  await logAviationAction({
    aircraftId, dealerId: aircraft.dealerId, userId, actorId: userId,
    action: 'aircraft_created', resource: 'aircraft', resourceId: aircraftId,
    ipAddress: meta?.ipAddress, deviceUuid: meta?.deviceUuid,
  });

  emitToUser(userId, 'aviation:listed', { aircraft: formatAircraft(aircraft) });
  return formatAircraft(aircraft);
}

export async function updateAircraft(userId: string, aircraftId: string, updates: Record<string, unknown>, userRole?: string) {
  await assertAviationPermission(userId, 'aircraft.manage', userRole);
  const aircraft = await Aircraft.findOneAndUpdate(
    { aircraftId, deletedAt: null },
    { ...updates, updatedBy: new Types.ObjectId(userId) },
    { new: true }
  );
  if (!aircraft) throw new Error('AIRCRAFT_NOT_FOUND');

  if (updates.listPrice !== undefined) {
    emitToUser(userId, 'aviation:price:change', { aircraftId, listPrice: aircraft.listPrice });
  }

  if (aircraft.companyId) await syncAircraftToBusinessAsset(aircraft, userId);
  return formatAircraft(aircraft);
}

export async function listAircraftForSale(userId: string, aircraftId: string, userRole?: string) {
  await assertAviationPermission(userId, 'aircraft.approve', userRole);
  const aircraft = await Aircraft.findOneAndUpdate(
    { aircraftId, deletedAt: null },
    { status: 'listed', isAvailable: true, updatedBy: new Types.ObjectId(userId) },
    { new: true }
  );
  if (!aircraft) throw new Error('AIRCRAFT_NOT_FOUND');
  emitToUser(userId, 'aviation:listed', { aircraft: formatAircraft(aircraft) });
  return formatAircraft(aircraft);
}

export async function reserveAircraft(userId: string, aircraftId: string, hours = 72, userRole?: string) {
  await assertAviationPermission(userId, 'inventory.reserve', userRole);
  const aircraft = await getAircraftOrThrow(aircraftId);
  aircraft.status = 'reserved';
  aircraft.isAvailable = false;
  await aircraft.save();

  const inv = await AircraftInventory.findOne({ aircraftId, deletedAt: null });
  if (inv) {
    inv.status = 'reserved';
    inv.reservedBy = new Types.ObjectId(userId);
    inv.reservedUntil = new Date(Date.now() + hours * 3600000);
    await inv.save();
  }

  emitToUser(userId, 'aviation:reserved', { aircraftId, reservedUntil: inv?.reservedUntil });
  return { aircraftId, reservedUntil: inv?.reservedUntil };
}

export async function moveAircraft(
  userId: string,
  aircraftId: string,
  data: { airportId?: string; hangarId?: string; latitude?: number; longitude?: number },
  userRole?: string
) {
  await assertAviationPermission(userId, 'aircraft.move', userRole);
  const aircraft = await getAircraftOrThrow(aircraftId);

  if (data.airportId) aircraft.currentAirportId = data.airportId;
  if (data.hangarId) aircraft.currentHangarId = data.hangarId;
  if (data.latitude !== undefined && data.longitude !== undefined) {
    aircraft.location = { ...aircraft.location, latitude: data.latitude, longitude: data.longitude, airportId: data.airportId, hangarId: data.hangarId };
  }
  aircraft.status = 'in_transit';
  await aircraft.save();

  emitToUser(userId, 'aviation:moved', { aircraftId, airportId: data.airportId, hangarId: data.hangarId });
  return formatAircraft(aircraft);
}

// Dealers
export async function createDealer(userId: string, data: { companyId: string; name: string; tradeName: string; licenseNumber: string; address: string; city: string; district: string; phone: string; email: string; homeAirportId?: string }, userRole?: string) {
  await assertAviationPermission(userId, 'dealers.create', userRole);
  const company = await Company.findOne({ companyId: data.companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');

  const dealer = await AircraftDealer.create({
    dealerId: id('DLR'),
    ...data,
    ownerUserId: new Types.ObjectId(userId),
    iban: company.iban,
    categories: DEFAULT_AIRCRAFT_CATEGORIES as unknown as string[],
    createdBy: new Types.ObjectId(userId),
  });
  return dealer;
}

export async function listDealers(userId: string, userRole?: string) {
  await assertAviationPermission(userId, 'dealers.view', userRole);
  return AircraftDealer.find({ deletedAt: null, status: 'active' }).sort({ name: 1 });
}

export async function getDealerFleet(userId: string, dealerId: string, userRole?: string) {
  await assertAviationPermission(userId, 'fleet.view', userRole);
  const inventory = await AircraftInventory.find({ dealerId, deletedAt: null });
  const aircraftList = await Aircraft.find({ dealerId, deletedAt: null });
  return { inventory, fleet: aircraftList.map(formatAircraft) };
}

// Airports & Infrastructure
export async function createAirport(userId: string, data: Record<string, unknown>, userRole?: string) {
  await assertAviationPermission(userId, 'airports.create', userRole);
  const airport = await Airport.create({
    airportId: id('APT'),
    code: data.code ?? `GULF${String(await Airport.countDocuments() + 1).padStart(3, '0')}`,
    name: data.name,
    type: data.type ?? 'airport',
    city: data.city,
    district: data.district,
    country: data.country ?? 'GULF',
    latitude: data.latitude,
    longitude: data.longitude,
    elevation: data.elevation ?? 0,
    hasFuelStation: data.hasFuelStation ?? false,
    hasMaintenance: data.hasMaintenance ?? false,
    isGovernment: data.isGovernment ?? false,
    isMilitary: data.isMilitary ?? false,
    companyId: data.companyId,
    ownerUserId: new Types.ObjectId(userId),
    createdBy: new Types.ObjectId(userId),
  });
  return airport;
}

export async function listAirports(userId: string, filters: { type?: string; city?: string; companyId?: string }, userRole?: string) {
  await assertAviationPermission(userId, 'airports.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null, status: 'active' };
  if (filters.type) query.type = filters.type;
  if (filters.city) query.city = new RegExp(filters.city, 'i');
  if (filters.companyId) query.companyId = filters.companyId;
  return Airport.find(query).sort({ name: 1 });
}

export async function getAirport(userId: string, airportId: string, userRole?: string) {
  await assertAviationPermission(userId, 'airports.view', userRole);
  const airport = await Airport.findOne({ airportId, deletedAt: null });
  if (!airport) throw new Error('AIRPORT_NOT_FOUND');
  const [hangars, runways, aircraftAtAirport] = await Promise.all([
    AircraftHangar.find({ airportId, deletedAt: null }),
    Runway.find({ airportId, deletedAt: null }),
    Aircraft.find({ currentAirportId: airportId, deletedAt: null }).limit(20),
  ]);
  return { airport, hangars, runways, aircraft: aircraftAtAirport.map(formatAircraft) };
}

export async function createHangar(userId: string, data: Record<string, unknown>, userRole?: string) {
  await assertAviationPermission(userId, 'hangars.create', userRole);
  const hangar = await AircraftHangar.create({
    hangarId: id('HGR'),
    airportId: data.airportId,
    name: data.name,
    type: data.type ?? 'commercial',
    capacity: data.capacity ?? 1,
    companyId: data.companyId,
    ownerUserId: new Types.ObjectId(userId),
    monthlyRate: data.monthlyRate ?? 0,
    hasMaintenance: data.hasMaintenance ?? false,
    createdBy: new Types.ObjectId(userId),
  });
  await Airport.updateOne({ airportId: data.airportId }, { $inc: { hangarCount: 1 } });
  return hangar;
}

export async function createRunway(userId: string, data: Record<string, unknown>, userRole?: string) {
  await assertAviationPermission(userId, 'runways.manage', userRole);
  const runway = await Runway.create({
    runwayId: id('RWY'),
    airportId: data.airportId,
    designation: data.designation,
    length: data.length,
    width: data.width,
    surface: data.surface ?? 'asphalt',
    lightingType: data.lightingType ?? 'standard',
    createdBy: new Types.ObjectId(userId),
  });
  await Airport.updateOne({ airportId: data.airportId }, { $inc: { runwayCount: 1 } });
  return runway;
}

// Offers
export async function createOffer(userId: string, data: { aircraftId: string; amount: number; message?: string; tradeInAircraftId?: string; tradeInValue?: number }, userRole?: string) {
  await assertAviationPermission(userId, 'offers.create', userRole);
  const aircraft = await getAircraftOrThrow(data.aircraftId);

  const offer = await AircraftOffer.create({
    offerId: id('OFF'),
    aircraftId: data.aircraftId,
    buyerUserId: new Types.ObjectId(userId),
    sellerUserId: aircraft.ownerUserId,
    dealerId: aircraft.dealerId,
    companyId: aircraft.companyId,
    amount: data.amount,
    tradeInAircraftId: data.tradeInAircraftId,
    tradeInValue: data.tradeInValue,
    message: data.message,
    expiresAt: new Date(Date.now() + 14 * 24 * 3600000),
    createdBy: new Types.ObjectId(userId),
  });

  aircraft.status = 'under_offer';
  await aircraft.save();

  if (aircraft.ownerUserId) {
    await notifyAviationUser(aircraft.ownerUserId.toString(), 'New Aircraft Offer', `₴${data.amount} offer on ${aircraft.brand} ${aircraft.aircraftModel}`);
    emitToUser(aircraft.ownerUserId.toString(), 'aviation:offer:received', { offerId: offer.offerId, amount: data.amount });
  }
  return offer;
}

export async function acceptOffer(userId: string, offerId: string, userRole?: string) {
  await assertAviationPermission(userId, 'offers.manage', userRole);
  const offer = await AircraftOffer.findOne({ offerId, deletedAt: null });
  if (!offer) throw new Error('OFFER_NOT_FOUND');
  offer.status = 'accepted';
  await offer.save();
  emitToUser(offer.buyerUserId.toString(), 'aviation:offer:accepted', { offerId });
  return completeSale(userId, offer.aircraftId, offer.buyerUserId.toString(), offer.amount, 'cash', userRole, offer.offerId);
}

export async function counterOffer(userId: string, offerId: string, counterAmount: number, message?: string, userRole?: string) {
  await assertAviationPermission(userId, 'offers.negotiate', userRole);
  const offer = await AircraftOffer.findOne({ offerId, deletedAt: null });
  if (!offer) throw new Error('OFFER_NOT_FOUND');
  offer.status = 'countered';
  offer.counterAmount = counterAmount;
  offer.counterBy = new Types.ObjectId(userId);
  offer.negotiationHistory.push({ amount: counterAmount, by: new Types.ObjectId(userId), message, at: new Date() });
  await offer.save();
  emitToUser(offer.buyerUserId.toString(), 'aviation:offer:received', { offerId, counterAmount });
  return offer;
}

export async function listOffers(userId: string, aircraftId?: string, userRole?: string) {
  await assertAviationPermission(userId, 'offers.view', userRole);
  const filter: Record<string, unknown> = { deletedAt: null };
  if (aircraftId) filter.aircraftId = aircraftId;
  return AircraftOffer.find(filter).sort({ createdAt: -1 }).limit(50);
}

// Sales
export async function completeSale(
  userId: string,
  aircraftId: string,
  buyerUserId: string,
  salePrice: number,
  paymentType: 'cash' | 'installment' | 'bank_financing' | 'leasing' | 'trade_in',
  userRole?: string,
  offerId?: string
) {
  await assertAviationPermission(userId, 'sales.manage', userRole);
  const aircraft = await getAircraftOrThrow(aircraftId);
  const taxAmount = salePrice * TAX_RATE_SALE;
  const commission = salePrice * 0.04;

  const sale = await AircraftSale.create({
    saleId: id('SALE'),
    aircraftId,
    offerId,
    buyerUserId: new Types.ObjectId(buyerUserId),
    sellerUserId: aircraft.ownerUserId!,
    dealerId: aircraft.dealerId,
    companyId: aircraft.companyId,
    salePrice,
    taxAmount,
    commission,
    paymentType,
    status: 'in_escrow',
    createdBy: new Types.ObjectId(userId),
  });

  const netAmount = salePrice - taxAmount - commission;
  if (aircraft.companyId) {
    await transferAircraftFunds(undefined, aircraft.companyId, netAmount, `Aircraft sale ${aircraft.brand} ${aircraft.aircraftModel}`, sale.saleId);
    await recordAircraftRevenue(aircraft.companyId, aircraftId, netAmount, userId);
  }

  aircraft.status = 'sold';
  aircraft.isAvailable = false;
  aircraft.ownerUserId = new Types.ObjectId(buyerUserId);
  await aircraft.save();

  const inv = await AircraftInventory.findOne({ aircraftId, deletedAt: null });
  if (inv) {
    inv.status = 'sold';
    inv.soldAt = new Date();
    await inv.save();
    if (aircraft.dealerId) await AircraftDealer.updateOne({ dealerId: aircraft.dealerId }, { $inc: { inventoryCount: -1 } });
  }

  sale.status = 'completed';
  sale.completedAt = new Date();
  sale.signatureHash = createDigitalSignature(userId, sale.saleId);
  await sale.save();

  emitToUser(buyerUserId, 'aviation:sold', { aircraftId, saleId: sale.saleId });
  await updateDealerAnalytics(aircraft.dealerId, aircraft.companyId);
  emitToUser(userId, 'aviation:analytics:update', { dealerId: aircraft.dealerId });
  return sale;
}

export async function listSales(userId: string, dealerId?: string, userRole?: string) {
  await assertAviationPermission(userId, 'sales.view', userRole);
  const filter: Record<string, unknown> = { deletedAt: null };
  if (dealerId) filter.dealerId = dealerId;
  return AircraftSale.find(filter).sort({ createdAt: -1 }).limit(50);
}

// Finance & Leasing
export async function createFinance(userId: string, data: { aircraftId: string; type: 'installment' | 'bank_financing' | 'leasing'; principal: number; downPayment: number; interestRate: number; termMonths: number; lender: string }, userRole?: string) {
  await assertAviationPermission(userId, 'finance.create', userRole);
  const monthlyRate = data.interestRate / 100 / 12;
  const financed = data.principal - data.downPayment;
  const monthlyPayment = financed * (monthlyRate * Math.pow(1 + monthlyRate, data.termMonths)) / (Math.pow(1 + monthlyRate, data.termMonths) - 1);

  const finance = await AircraftFinance.create({
    financeId: id('FIN'),
    aircraftId: data.aircraftId,
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

  emitToUser(userId, 'aviation:finance:update', { financeId: finance.financeId });
  return finance;
}

export async function createLease(userId: string, data: { aircraftId: string; lessorCompanyId: string; monthlyRate: number; termMonths: number; securityDeposit?: number }, userRole?: string) {
  await assertAviationPermission(userId, 'finance.leasing', userRole);
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + data.termMonths * 30 * 24 * 3600000);

  const lease = await AircraftLease.create({
    leaseId: id('LSE'),
    aircraftId: data.aircraftId,
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

  const aircraft = await getAircraftOrThrow(data.aircraftId);
  aircraft.status = 'leased';
  aircraft.isAvailable = false;
  await aircraft.save();

  emitToUser(userId, 'aviation:leased', { aircraftId: data.aircraftId, leaseId: lease.leaseId });
  return lease;
}

export async function listFinance(userId: string, userRole?: string) {
  await assertAviationPermission(userId, 'finance.view', userRole);
  return AircraftFinance.find({ buyerUserId: userId, deletedAt: null }).sort({ createdAt: -1 });
}

export async function listLeases(userId: string, userRole?: string) {
  await assertAviationPermission(userId, 'finance.view', userRole);
  return AircraftLease.find({ lesseeUserId: userId, deletedAt: null }).sort({ createdAt: -1 });
}

// Auctions
export async function createAuction(userId: string, data: { aircraftId: string; startingBid: number; reservePrice?: number; buyNowPrice?: number; durationHours: number }, userRole?: string) {
  await assertAviationPermission(userId, 'auctions.create', userRole);
  const aircraft = await getAircraftOrThrow(data.aircraftId);

  const auction = await AircraftAuction.create({
    auctionId: id('AUC'),
    aircraftId: data.aircraftId,
    dealerId: aircraft.dealerId,
    companyId: aircraft.companyId,
    startingBid: data.startingBid,
    currentBid: data.startingBid,
    reservePrice: data.reservePrice,
    buyNowPrice: data.buyNowPrice,
    status: 'active',
    startsAt: new Date(),
    endsAt: new Date(Date.now() + data.durationHours * 3600000),
    createdBy: new Types.ObjectId(userId),
  });

  aircraft.status = 'in_auction';
  await aircraft.save();

  emitToUser(userId, 'aviation:auction', { auctionId: auction.auctionId, aircraftId: data.aircraftId });
  return auction;
}

export async function placeBid(userId: string, auctionId: string, amount: number, userRole?: string) {
  await assertAviationPermission(userId, 'auctions.bid', userRole);
  const auction = await AircraftAuction.findOne({ auctionId, status: 'active', deletedAt: null });
  if (!auction) throw new Error('AUCTION_NOT_FOUND');
  if (amount <= auction.currentBid) throw new Error('BID_TOO_LOW');

  auction.currentBid = amount;
  auction.highestBidderId = new Types.ObjectId(userId);
  auction.bidCount += 1;
  auction.bids.push({ bidId: id('BID'), bidderId: new Types.ObjectId(userId), amount, placedAt: new Date() });
  await auction.save();

  emitToUser(userId, 'aviation:auction', { auctionId, currentBid: amount });
  return auction;
}

export async function listAuctions(userId: string, userRole?: string) {
  await assertAviationPermission(userId, 'auctions.view', userRole);
  return AircraftAuction.find({ status: 'active', deletedAt: null }).sort({ endsAt: 1 });
}

// Maintenance
export async function createMaintenance(userId: string, data: Record<string, unknown>, userRole?: string) {
  await assertAviationPermission(userId, 'maintenance.create', userRole);
  const maintenance = await AircraftMaintenance.create({
    maintenanceId: id('MAINT'),
    aircraftId: data.aircraftId,
    type: data.type ?? 'service',
    title: data.title,
    description: data.description ?? '',
    cost: data.cost ?? 0,
    flightHours: data.flightHours ?? 0,
    mechanicUserId: data.mechanicUserId ? new Types.ObjectId(data.mechanicUserId as string) : undefined,
    airportId: data.airportId,
    status: 'completed',
    requestedBy: new Types.ObjectId(userId),
    completedAt: new Date(),
    createdBy: new Types.ObjectId(userId),
  });

  const aircraft = await Aircraft.findOne({ aircraftId: data.aircraftId as string });
  if (aircraft) {
    aircraft.repairHistory.push({
      repairId: maintenance.maintenanceId,
      description: data.title as string,
      cost: data.cost as number ?? 0,
      flightHoursAtRepair: data.flightHours as number ?? aircraft.flightHours,
      performedAt: new Date(),
    });
    await aircraft.save();
    if (aircraft.companyId && (data.cost as number) > 0) {
      await recordAircraftExpense(aircraft.companyId, aircraft.aircraftId, data.cost as number, 'maintenance', userId);
      await AircraftDealer.updateOne({ dealerId: aircraft.dealerId }, { $inc: { maintenanceCost: data.cost as number } });
    }
  }

  emitToUser(userId, 'aviation:maintenance', { maintenanceId: maintenance.maintenanceId, aircraftId: data.aircraftId });
  return maintenance;
}

export async function scheduleInspection(userId: string, data: Record<string, unknown>, userRole?: string) {
  await assertAviationPermission(userId, 'inspections.schedule', userRole);
  return AircraftInspection.create({
    inspectionId: id('INSP'),
    aircraftId: data.aircraftId,
    type: data.type ?? 'annual',
    inspectorUserId: new Types.ObjectId(userId),
    scheduledAt: new Date(data.scheduledAt as string),
    flightHoursAtInspection: data.flightHours as number ?? 0,
    findings: '',
    createdBy: new Types.ObjectId(userId),
  });
}

// Search
export async function searchAircraft(userId: string, params: Record<string, unknown>, userRole?: string) {
  await assertAviationPermission(userId, 'search.advanced', userRole);
  if (params.registration) {
    const aircraft = await Aircraft.findOne({ registrationNumber: new RegExp(String(params.registration), 'i'), deletedAt: null });
    return aircraft ? [formatAircraft(aircraft)] : [];
  }
  const result = await listAircraft(userId, params as never, userRole);
  return result.items;
}

// Favorites
export async function toggleFavorite(userId: string, aircraftId: string, userRole?: string) {
  await assertAviationPermission(userId, 'favorites.manage', userRole);
  const aircraft = await getAircraftOrThrow(aircraftId);
  const isFav = aircraft.favoriteUserIds.some((uid) => uid.toString() === userId);
  if (isFav) {
    aircraft.favoriteUserIds = aircraft.favoriteUserIds.filter((uid) => uid.toString() !== userId);
  } else {
    aircraft.favoriteUserIds.push(new Types.ObjectId(userId));
  }
  await aircraft.save();
  return { favorited: !isFav, aircraftId };
}

export async function listFavorites(userId: string, userRole?: string) {
  await assertAviationPermission(userId, 'favorites.manage', userRole);
  const aircraftList = await Aircraft.find({ favoriteUserIds: userId, deletedAt: null });
  return aircraftList.map(formatAircraft);
}

// Analytics
export async function getAnalytics(userId: string, dealerId?: string, companyId?: string, userRole?: string) {
  await assertAviationPermission(userId, 'analytics.view', userRole);
  await updateDealerAnalytics(dealerId, companyId);
  const filter: Record<string, unknown> = { period: currentPeriod() };
  if (dealerId) filter.dealerId = dealerId;
  else if (companyId) filter.companyId = companyId;
  return AircraftAnalytics.findOne(filter);
}

// RBAC & Audit
export async function getRbac(userId: string, userRole?: string) {
  await assertAviationPermission(userId, 'rbac.configure', userRole);
  return Promise.all(AVIATION_ROLES.map(async (role) => ({ role, permissions: await getRolePermissions(role) })));
}

export async function updateRbac(userId: string, role: AviationRole, permissions: string[], userRole?: string) {
  await assertAviationPermission(userId, 'rbac.configure', userRole);
  return updateRolePermissions(role, permissions as never, userId);
}

export async function getAuditLogs(userId: string, aircraftId?: string, userRole?: string) {
  await assertAviationPermission(userId, 'audit.view', userRole);
  const filter: Record<string, unknown> = {};
  if (aircraftId) filter.aircraftId = aircraftId;
  return AircraftAuditLog.find(filter).sort({ createdAt: -1 }).limit(100);
}

export { createDigitalSignature };
