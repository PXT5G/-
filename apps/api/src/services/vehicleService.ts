import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { User } from '../database/models/User';
import { Company } from '../database/models/Company';
import { Vehicle } from '../database/models/Vehicle';
import { VehicleDealer } from '../database/models/VehicleDealer';
import { VehicleInventory } from '../database/models/VehicleInventory';
import { VehicleSale } from '../database/models/VehicleSale';
import { VehicleOffer } from '../database/models/VehicleOffer';
import { VehicleFinance } from '../database/models/VehicleFinance';
import { VehicleLease } from '../database/models/VehicleLease';
import { VehicleAuction } from '../database/models/VehicleAuction';
import { VehicleMaintenance } from '../database/models/VehicleMaintenance';
import { VehicleInspection } from '../database/models/VehicleInspection';
import { VehicleInsurance } from '../database/models/VehicleInsurance';
import { VehicleWarranty } from '../database/models/VehicleWarranty';
import { VehicleAnalytics } from '../database/models/VehicleAnalytics';
import { VehicleAuditLog } from '../database/models/VehicleAuditLog';
import {
  VEHICLES_APP_BUNDLE,
  VEHICLE_ROLES,
  DEFAULT_VEHICLE_CATEGORIES,
  TAX_RATE_SALE,
  type VehicleRole,
} from '../constants/vehicles';
import {
  seedVehicleRoleConfigs,
  assertVehiclePermission,
  getRolePermissions,
  updateRolePermissions,
  createDigitalSignature,
} from './vehicleRBACService';
import {
  logVehicleAction,
  notifyVehicleUser,
  currentPeriod,
  formatVehicle,
  syncVehicleToBusinessAsset,
  recordVehicleRevenue,
  recordVehicleExpense,
  transferVehicleFunds,
  getWorldLocation,
} from './vehicleIntegrationService';
import { emitToUser } from './socketService';
import { checkPermission } from './permissionBrokerService';

function id(prefix: string) {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function generateVin() {
  return `GULF${uuidv4().replace(/-/g, '').slice(0, 13).toUpperCase()}`;
}

async function getVehicleOrThrow(vehicleId: string) {
  const vehicle = await Vehicle.findOne({ vehicleId, deletedAt: null });
  if (!vehicle) throw new Error('VEHICLE_NOT_FOUND');
  return vehicle;
}

async function updateDealerAnalytics(dealerId?: string, companyId?: string) {
  const period = currentPeriod();
  const filter: Record<string, unknown> = { deletedAt: null };
  if (dealerId) filter.dealerId = dealerId;
  else if (companyId) filter.companyId = companyId;

  const vehicles = await Vehicle.find(dealerId ? { dealerId, deletedAt: null } : companyId ? { companyId, deletedAt: null } : { deletedAt: null });
  const inventory = await VehicleInventory.find({ ...filter, status: { $in: ['in_stock', 'reserved'] } });
  const sales = await VehicleSale.find({ ...filter, status: 'completed' });

  const inventoryValue = inventory.reduce((s, i) => s + i.listPrice, 0);
  const totalRevenue = sales.reduce((s, sale) => s + sale.salePrice, 0);
  const brandSales = await VehicleSale.aggregate([
    { $match: { ...filter, status: 'completed' } },
    { $lookup: { from: 'vehicles', localField: 'vehicleId', foreignField: 'vehicleId', as: 'vehicle' } },
    { $unwind: '$vehicle' },
    { $group: { _id: { brand: '$vehicle.brand', model: '$vehicle.vehicleModel' }, unitsSold: { $sum: 1 }, revenue: { $sum: '$salePrice' } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  await VehicleAnalytics.findOneAndUpdate(
    { analyticsId: `AN-${dealerId ?? companyId ?? 'global'}-${period}` },
    {
      analyticsId: `AN-${dealerId ?? companyId ?? 'global'}-${period}`,
      dealerId,
      companyId,
      period,
      totalInventory: inventory.length,
      inventoryValue,
      totalRevenue,
      unitsSold: sales.length,
      unitsListed: vehicles.filter((v) => v.status === 'listed' || v.status === 'featured').length,
      averageSalePrice: sales.length > 0 ? totalRevenue / sales.length : 0,
      netProfit: totalRevenue,
      bestSellers: brandSales.map((b) => ({
        vehicleId: '',
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

export async function initializeVehicles(userId: string, userRole?: string) {
  await seedVehicleRoleConfigs();
  const hasApp = await checkPermission(userId, VEHICLES_APP_BUNDLE, 'location');
  if (!hasApp && userRole !== 'admin') throw new Error('APP_NOT_INSTALLED');

  const role: VehicleRole = userRole === 'admin' ? 'platform_admin' : 'buyer';
  const permissions = await getRolePermissions(role);

  emitToUser(userId, 'vehicles:initialized', { permissions, categories: DEFAULT_VEHICLE_CATEGORIES });

  return {
    initialized: true,
    permissions,
    categories: DEFAULT_VEHICLE_CATEGORIES,
    roles: VEHICLE_ROLES,
    ownedCount: await Vehicle.countDocuments({ ownerUserId: userId, deletedAt: null }),
    favoriteCount: await Vehicle.countDocuments({ favoriteUserIds: userId, deletedAt: null }),
  };
}

export async function getDashboard(userId: string, userRole?: string) {
  await assertVehiclePermission(userId, 'dashboard.view', userRole);

  const featured = await Vehicle.find({ isFeatured: true, status: { $in: ['listed', 'featured'] }, deletedAt: null }).limit(6);
  const dealers = await VehicleDealer.find({ status: 'active', deletedAt: null }).limit(5);
  const location = await getWorldLocation(userId).catch(() => null);

  return {
    featured: featured.map(formatVehicle),
    dealers,
    stats: {
      totalListed: await Vehicle.countDocuments({ status: { $in: ['listed', 'featured'] }, deletedAt: null }),
      forSale: await Vehicle.countDocuments({ isAvailable: true, listPrice: { $gt: 0 }, deletedAt: null }),
      auctions: await VehicleAuction.countDocuments({ status: 'active', deletedAt: null }),
      dealers: await VehicleDealer.countDocuments({ status: 'active', deletedAt: null }),
    },
    location,
    permissions: await getRolePermissions(userRole === 'admin' ? 'platform_admin' : 'buyer'),
  };
}

export async function listVehicles(
  userId: string,
  filters: {
    page?: number; limit?: number; category?: string; brand?: string; model?: string;
    minPrice?: number; maxPrice?: number; maxMileage?: number; fuelType?: string;
    transmission?: string; color?: string; dealerId?: string; companyId?: string;
    isFeatured?: boolean; isAvailable?: boolean;
  },
  userRole?: string
) {
  await assertVehiclePermission(userId, 'vehicles.view', userRole);
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 20, 100);
  const query: Record<string, unknown> = { deletedAt: null };

  if (filters.category) query.category = filters.category;
  if (filters.brand) query.brand = new RegExp(filters.brand, 'i');
  if (filters.model) query.vehicleModel = new RegExp(filters.model, 'i');
  if (filters.dealerId) query.dealerId = filters.dealerId;
  if (filters.companyId) query.companyId = filters.companyId;
  if (filters.color) query.color = new RegExp(filters.color, 'i');
  if (filters.isFeatured !== undefined) query.isFeatured = filters.isFeatured;
  if (filters.isAvailable !== undefined) query.isAvailable = filters.isAvailable;
  if (filters.maxMileage) query.mileage = { $lte: filters.maxMileage };
  if (filters.fuelType) query['specs.fuelType'] = filters.fuelType;
  if (filters.transmission) query['specs.transmission'] = filters.transmission;
  if (filters.minPrice || filters.maxPrice) {
    query.listPrice = {};
    if (filters.minPrice) (query.listPrice as Record<string, number>).$gte = filters.minPrice;
    if (filters.maxPrice) (query.listPrice as Record<string, number>).$lte = filters.maxPrice;
  }

  const [items, total] = await Promise.all([
    Vehicle.find(query).sort({ isFeatured: -1, updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
    Vehicle.countDocuments(query),
  ]);

  return { items: items.map(formatVehicle), total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getVehicle(userId: string, vehicleId: string, userRole?: string) {
  await assertVehiclePermission(userId, 'vehicles.view', userRole);
  const vehicle = await getVehicleOrThrow(vehicleId);
  vehicle.viewCount += 1;
  await vehicle.save();
  return formatVehicle(vehicle);
}

export async function createVehicle(userId: string, data: Record<string, unknown>, userRole?: string, meta?: { ipAddress?: string; deviceUuid?: string }) {
  await assertVehiclePermission(userId, 'vehicles.create', userRole);

  const vehicleId = id('VH');
  const vin = (data.vin as string) || generateVin();
  const count = await Vehicle.countDocuments();

  const vehicle = await Vehicle.create({
    vehicleId,
    vin,
    plateNumber: data.plateNumber ?? `GULF-${String(count + 1).padStart(5, '0')}`,
    serialNumber: data.serialNumber ?? `SN-${vehicleId}`,
    brand: data.brand,
    manufacturer: data.manufacturer ?? data.brand,
    vehicleModel: data.model,
    generation: data.generation,
    trim: data.trim,
    year: data.year,
    category: data.category,
    mileage: data.mileage ?? 0,
    specs: data.specs ?? {},
    color: data.color ?? '',
    interiorColor: data.interiorColor ?? '',
    condition: data.condition ?? 'good',
    listPrice: data.listPrice ?? 0,
    dealerPrice: data.dealerPrice,
    marketValue: data.marketValue ?? data.listPrice ?? 0,
    status: 'pending',
    ownerUserId: new Types.ObjectId(userId),
    companyId: data.companyId,
    dealerId: data.dealerId,
    location: data.location,
    mods: data.mods ?? [],
    createdBy: new Types.ObjectId(userId),
  });

  if (data.dealerId && data.companyId) {
    const inv = await VehicleInventory.create({
      inventoryId: id('INV'),
      dealerId: data.dealerId as string,
      companyId: data.companyId as string,
      vehicleId,
      acquisitionCost: (data.dealerPrice as number) ?? (data.listPrice as number) ?? 0,
      listPrice: (data.listPrice as number) ?? 0,
      createdBy: new Types.ObjectId(userId),
    });
    vehicle.inventoryId = inv.inventoryId;
    await vehicle.save();
    await VehicleDealer.updateOne({ dealerId: data.dealerId }, { $inc: { inventoryCount: 1 } });
  }

  if (vehicle.companyId) await syncVehicleToBusinessAsset(vehicle, userId);

  await logVehicleAction({
    vehicleId, dealerId: vehicle.dealerId, userId, actorId: userId,
    action: 'vehicle_created', resource: 'vehicle', resourceId: vehicleId,
    ipAddress: meta?.ipAddress, deviceUuid: meta?.deviceUuid,
  });

  emitToUser(userId, 'vehicles:listed', { vehicle: formatVehicle(vehicle) });
  return formatVehicle(vehicle);
}

export async function updateVehicle(userId: string, vehicleId: string, updates: Record<string, unknown>, userRole?: string) {
  await assertVehiclePermission(userId, 'vehicles.manage', userRole);
  const vehicle = await Vehicle.findOneAndUpdate(
    { vehicleId, deletedAt: null },
    { ...updates, updatedBy: new Types.ObjectId(userId) },
    { new: true }
  );
  if (!vehicle) throw new Error('VEHICLE_NOT_FOUND');

  if (updates.listPrice !== undefined) {
    emitToUser(userId, 'vehicles:price:change', { vehicleId, listPrice: vehicle.listPrice });
  }

  if (vehicle.companyId) await syncVehicleToBusinessAsset(vehicle, userId);
  emitToUser(userId, 'vehicles:inventory:update', { vehicleId });
  return formatVehicle(vehicle);
}

export async function listVehicle(userId: string, vehicleId: string, userRole?: string) {
  await assertVehiclePermission(userId, 'vehicles.approve', userRole);
  const vehicle = await Vehicle.findOneAndUpdate(
    { vehicleId, deletedAt: null },
    { status: 'listed', isAvailable: true, updatedBy: new Types.ObjectId(userId) },
    { new: true }
  );
  if (!vehicle) throw new Error('VEHICLE_NOT_FOUND');
  emitToUser(userId, 'vehicles:listed', { vehicle: formatVehicle(vehicle) });
  return formatVehicle(vehicle);
}

export async function reserveVehicle(userId: string, vehicleId: string, hours = 48, userRole?: string) {
  await assertVehiclePermission(userId, 'inventory.reserve', userRole);
  const vehicle = await getVehicleOrThrow(vehicleId);
  vehicle.status = 'reserved';
  vehicle.isAvailable = false;
  await vehicle.save();

  const inv = await VehicleInventory.findOne({ vehicleId, deletedAt: null });
  if (inv) {
    inv.status = 'reserved';
    inv.reservedBy = new Types.ObjectId(userId);
    inv.reservedUntil = new Date(Date.now() + hours * 3600000);
    await inv.save();
  }

  emitToUser(userId, 'vehicles:reserved', { vehicleId, reservedUntil: inv?.reservedUntil });
  return { vehicleId, reservedUntil: inv?.reservedUntil };
}

// Dealers
export async function createDealer(userId: string, data: { companyId: string; name: string; tradeName: string; licenseNumber: string; address: string; city: string; district: string; phone: string; email: string }, userRole?: string) {
  await assertVehiclePermission(userId, 'dealers.create', userRole);

  const company = await Company.findOne({ companyId: data.companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');

  const dealer = await VehicleDealer.create({
    dealerId: id('DLR'),
    ...data,
    ownerUserId: new Types.ObjectId(userId),
    iban: company.iban,
    categories: DEFAULT_VEHICLE_CATEGORIES as unknown as string[],
    createdBy: new Types.ObjectId(userId),
  });

  return dealer;
}

export async function listDealers(userId: string, userRole?: string) {
  await assertVehiclePermission(userId, 'dealers.view', userRole);
  return VehicleDealer.find({ deletedAt: null, status: 'active' }).sort({ name: 1 });
}

export async function getDealerInventory(userId: string, dealerId: string, userRole?: string) {
  await assertVehiclePermission(userId, 'inventory.view', userRole);
  const inventory = await VehicleInventory.find({ dealerId, deletedAt: null });
  const vehicles = await Vehicle.find({ dealerId, deletedAt: null });
  return { inventory, vehicles: vehicles.map(formatVehicle) };
}

// Offers
export async function createOffer(userId: string, data: { vehicleId: string; amount: number; message?: string; tradeInVehicleId?: string; tradeInValue?: number }, userRole?: string) {
  await assertVehiclePermission(userId, 'offers.create', userRole);
  const vehicle = await getVehicleOrThrow(data.vehicleId);

  const offer = await VehicleOffer.create({
    offerId: id('OFF'),
    vehicleId: data.vehicleId,
    buyerUserId: new Types.ObjectId(userId),
    sellerUserId: vehicle.ownerUserId,
    dealerId: vehicle.dealerId,
    companyId: vehicle.companyId,
    amount: data.amount,
    tradeInVehicleId: data.tradeInVehicleId,
    tradeInValue: data.tradeInValue,
    message: data.message,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
    createdBy: new Types.ObjectId(userId),
  });

  vehicle.status = 'under_offer';
  await vehicle.save();

  if (vehicle.ownerUserId) {
    await notifyVehicleUser(vehicle.ownerUserId.toString(), 'New Vehicle Offer', `₴${data.amount} offer on ${vehicle.brand} ${vehicle.vehicleModel}`);
    emitToUser(vehicle.ownerUserId.toString(), 'vehicles:offer:received', { offerId: offer.offerId, amount: data.amount });
  }

  return offer;
}

export async function acceptOffer(userId: string, offerId: string, userRole?: string) {
  await assertVehiclePermission(userId, 'offers.manage', userRole);
  const offer = await VehicleOffer.findOne({ offerId, deletedAt: null });
  if (!offer) throw new Error('OFFER_NOT_FOUND');
  offer.status = 'accepted';
  await offer.save();
  emitToUser(offer.buyerUserId.toString(), 'vehicles:offer:accepted', { offerId });
  return completeSale(userId, offer.vehicleId, offer.buyerUserId.toString(), offer.amount, 'cash', userRole, offer.offerId);
}

export async function counterOffer(userId: string, offerId: string, counterAmount: number, message?: string, userRole?: string) {
  await assertVehiclePermission(userId, 'offers.negotiate', userRole);
  const offer = await VehicleOffer.findOne({ offerId, deletedAt: null });
  if (!offer) throw new Error('OFFER_NOT_FOUND');
  offer.status = 'countered';
  offer.counterAmount = counterAmount;
  offer.counterBy = new Types.ObjectId(userId);
  offer.negotiationHistory.push({ amount: counterAmount, by: new Types.ObjectId(userId), message, at: new Date() });
  await offer.save();
  emitToUser(offer.buyerUserId.toString(), 'vehicles:offer:received', { offerId, counterAmount });
  return offer;
}

export async function listOffers(userId: string, vehicleId?: string, userRole?: string) {
  await assertVehiclePermission(userId, 'offers.view', userRole);
  const filter: Record<string, unknown> = { deletedAt: null };
  if (vehicleId) filter.vehicleId = vehicleId;
  return VehicleOffer.find(filter).sort({ createdAt: -1 }).limit(50);
}

// Sales
export async function completeSale(
  userId: string,
  vehicleId: string,
  buyerUserId: string,
  salePrice: number,
  paymentType: 'cash' | 'installment' | 'bank_financing' | 'leasing' | 'trade_in',
  userRole?: string,
  offerId?: string
) {
  await assertVehiclePermission(userId, 'sales.manage', userRole);
  const vehicle = await getVehicleOrThrow(vehicleId);
  const taxAmount = salePrice * TAX_RATE_SALE;
  const commission = salePrice * 0.03;

  const sale = await VehicleSale.create({
    saleId: id('SALE'),
    vehicleId,
    offerId,
    buyerUserId: new Types.ObjectId(buyerUserId),
    sellerUserId: vehicle.ownerUserId!,
    dealerId: vehicle.dealerId,
    companyId: vehicle.companyId,
    salePrice,
    taxAmount,
    commission,
    paymentType,
    status: 'in_escrow',
    createdBy: new Types.ObjectId(userId),
  });

  const netAmount = salePrice - taxAmount - commission;
  if (vehicle.companyId) {
    await transferVehicleFunds(undefined, vehicle.companyId, netAmount, `Vehicle sale ${vehicle.brand} ${vehicle.vehicleModel}`, sale.saleId);
    await recordVehicleRevenue(vehicle.companyId, vehicleId, netAmount, userId);
  }

  vehicle.status = 'sold';
  vehicle.isAvailable = false;
  vehicle.ownerUserId = new Types.ObjectId(buyerUserId);
  await vehicle.save();

  const inv = await VehicleInventory.findOne({ vehicleId, deletedAt: null });
  if (inv) {
    inv.status = 'sold';
    inv.soldAt = new Date();
    await inv.save();
    if (vehicle.dealerId) await VehicleDealer.updateOne({ dealerId: vehicle.dealerId }, { $inc: { inventoryCount: -1 } });
  }

  sale.status = 'completed';
  sale.completedAt = new Date();
  sale.signatureHash = createDigitalSignature(userId, sale.saleId);
  await sale.save();

  emitToUser(buyerUserId, 'vehicles:sold', { vehicleId, saleId: sale.saleId });
  await updateDealerAnalytics(vehicle.dealerId, vehicle.companyId);
  emitToUser(userId, 'vehicles:analytics:update', { dealerId: vehicle.dealerId });

  return sale;
}

export async function listSales(userId: string, dealerId?: string, userRole?: string) {
  await assertVehiclePermission(userId, 'sales.view', userRole);
  const filter: Record<string, unknown> = { deletedAt: null };
  if (dealerId) filter.dealerId = dealerId;
  return VehicleSale.find(filter).sort({ createdAt: -1 }).limit(50);
}

// Finance
export async function createFinance(userId: string, data: { vehicleId: string; type: 'installment' | 'bank_financing' | 'leasing'; principal: number; downPayment: number; interestRate: number; termMonths: number; lender: string }, userRole?: string) {
  await assertVehiclePermission(userId, 'finance.create', userRole);
  const monthlyRate = data.interestRate / 100 / 12;
  const financed = data.principal - data.downPayment;
  const monthlyPayment = financed * (monthlyRate * Math.pow(1 + monthlyRate, data.termMonths)) / (Math.pow(1 + monthlyRate, data.termMonths) - 1);

  const finance = await VehicleFinance.create({
    financeId: id('FIN'),
    vehicleId: data.vehicleId,
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

  emitToUser(userId, 'vehicles:finance:update', { financeId: finance.financeId });
  return finance;
}

export async function listFinance(userId: string, userRole?: string) {
  await assertVehiclePermission(userId, 'finance.view', userRole);
  return VehicleFinance.find({ buyerUserId: userId, deletedAt: null }).sort({ createdAt: -1 });
}

// Auctions
export async function createAuction(userId: string, data: { vehicleId: string; startingBid: number; reservePrice?: number; buyNowPrice?: number; durationHours: number }, userRole?: string) {
  await assertVehiclePermission(userId, 'auctions.create', userRole);
  const vehicle = await getVehicleOrThrow(data.vehicleId);

  const auction = await VehicleAuction.create({
    auctionId: id('AUC'),
    vehicleId: data.vehicleId,
    dealerId: vehicle.dealerId,
    companyId: vehicle.companyId,
    startingBid: data.startingBid,
    currentBid: data.startingBid,
    reservePrice: data.reservePrice,
    buyNowPrice: data.buyNowPrice,
    status: 'active',
    startsAt: new Date(),
    endsAt: new Date(Date.now() + data.durationHours * 3600000),
    createdBy: new Types.ObjectId(userId),
  });

  vehicle.status = 'in_auction';
  await vehicle.save();

  emitToUser(userId, 'vehicles:auction', { auctionId: auction.auctionId, vehicleId: data.vehicleId });
  return auction;
}

export async function placeBid(userId: string, auctionId: string, amount: number, userRole?: string) {
  await assertVehiclePermission(userId, 'auctions.bid', userRole);
  const auction = await VehicleAuction.findOne({ auctionId, status: 'active', deletedAt: null });
  if (!auction) throw new Error('AUCTION_NOT_FOUND');
  if (amount <= auction.currentBid) throw new Error('BID_TOO_LOW');

  auction.currentBid = amount;
  auction.highestBidderId = new Types.ObjectId(userId);
  auction.bidCount += 1;
  auction.bids.push({ bidId: id('BID'), bidderId: new Types.ObjectId(userId), amount, placedAt: new Date() });
  await auction.save();

  emitToUser(userId, 'vehicles:auction', { auctionId, currentBid: amount });
  return auction;
}

export async function listAuctions(userId: string, userRole?: string) {
  await assertVehiclePermission(userId, 'auctions.view', userRole);
  return VehicleAuction.find({ status: 'active', deletedAt: null }).sort({ endsAt: 1 });
}

// Maintenance & Inspections
export async function createMaintenance(userId: string, data: Record<string, unknown>, userRole?: string) {
  await assertVehiclePermission(userId, 'maintenance.create', userRole);
  const maintenance = await VehicleMaintenance.create({
    maintenanceId: id('MAINT'),
    vehicleId: data.vehicleId,
    type: data.type ?? 'service',
    title: data.title,
    description: data.description ?? '',
    cost: data.cost ?? 0,
    mileage: data.mileage ?? 0,
    requestedBy: new Types.ObjectId(userId),
    createdBy: new Types.ObjectId(userId),
  });

  const vehicle = await Vehicle.findOne({ vehicleId: data.vehicleId as string });
  if (vehicle) {
    vehicle.repairHistory.push({
      repairId: maintenance.maintenanceId,
      description: data.title as string,
      cost: data.cost as number ?? 0,
      performedAt: new Date(),
    });
    await vehicle.save();
    if (vehicle.companyId && (data.cost as number) > 0) {
      await recordVehicleExpense(vehicle.companyId, vehicle.vehicleId, data.cost as number, 'maintenance', userId);
    }
  }

  return maintenance;
}

export async function scheduleInspection(userId: string, data: Record<string, unknown>, userRole?: string) {
  await assertVehiclePermission(userId, 'inspections.schedule', userRole);
  return VehicleInspection.create({
    inspectionId: id('INSP'),
    vehicleId: data.vehicleId,
    type: data.type ?? 'pre_sale',
    inspectorUserId: new Types.ObjectId(userId),
    scheduledAt: new Date(data.scheduledAt as string),
    mileageAtInspection: data.mileage as number ?? 0,
    findings: '',
    createdBy: new Types.ObjectId(userId),
  });
}

// Search
export async function searchVehicles(userId: string, params: Record<string, unknown>, userRole?: string) {
  await assertVehiclePermission(userId, 'search.advanced', userRole);
  return listVehicles(userId, params as never, userRole);
}

// Favorites
export async function toggleFavorite(userId: string, vehicleId: string, userRole?: string) {
  await assertVehiclePermission(userId, 'favorites.manage', userRole);
  const vehicle = await getVehicleOrThrow(vehicleId);
  const isFav = vehicle.favoriteUserIds.some((uid) => uid.toString() === userId);
  if (isFav) {
    vehicle.favoriteUserIds = vehicle.favoriteUserIds.filter((uid) => uid.toString() !== userId);
  } else {
    vehicle.favoriteUserIds.push(new Types.ObjectId(userId));
  }
  await vehicle.save();
  return { favorited: !isFav, vehicleId };
}

export async function listFavorites(userId: string, userRole?: string) {
  await assertVehiclePermission(userId, 'favorites.manage', userRole);
  const vehicles = await Vehicle.find({ favoriteUserIds: userId, deletedAt: null });
  return vehicles.map(formatVehicle);
}

// Analytics
export async function getAnalytics(userId: string, dealerId?: string, companyId?: string, userRole?: string) {
  await assertVehiclePermission(userId, 'analytics.view', userRole);
  await updateDealerAnalytics(dealerId, companyId);
  const filter: Record<string, unknown> = { period: currentPeriod() };
  if (dealerId) filter.dealerId = dealerId;
  else if (companyId) filter.companyId = companyId;
  return VehicleAnalytics.findOne(filter);
}

// RBAC & Audit
export async function getRbac(userId: string, userRole?: string) {
  await assertVehiclePermission(userId, 'rbac.configure', userRole);
  return Promise.all(VEHICLE_ROLES.map(async (role) => ({ role, permissions: await getRolePermissions(role) })));
}

export async function updateRbac(userId: string, role: VehicleRole, permissions: string[], userRole?: string) {
  await assertVehiclePermission(userId, 'rbac.configure', userRole);
  return updateRolePermissions(role, permissions as never, userId);
}

export async function getAuditLogs(userId: string, vehicleId?: string, userRole?: string) {
  await assertVehiclePermission(userId, 'audit.view', userRole);
  const filter: Record<string, unknown> = {};
  if (vehicleId) filter.vehicleId = vehicleId;
  return VehicleAuditLog.find(filter).sort({ createdAt: -1 }).limit(100);
}

export { createDigitalSignature };
