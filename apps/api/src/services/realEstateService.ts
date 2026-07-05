import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { User } from '../database/models/User';
import { Property } from '../database/models/Property';
import { PropertyOwner } from '../database/models/PropertyOwner';
import { PropertyImage } from '../database/models/PropertyImage';
import { PropertyVideo } from '../database/models/PropertyVideo';
import { PropertyFloorPlan } from '../database/models/PropertyFloorPlan';
import { PropertyDocument } from '../database/models/PropertyDocument';
import { PropertyOffer } from '../database/models/PropertyOffer';
import { PropertySale } from '../database/models/PropertySale';
import { PropertyRental } from '../database/models/PropertyRental';
import { PropertyLease } from '../database/models/PropertyLease';
import { PropertyTenant } from '../database/models/PropertyTenant';
import { PropertyMaintenance } from '../database/models/PropertyMaintenance';
import { PropertyInspection } from '../database/models/PropertyInspection';
import { PropertyInsurance } from '../database/models/PropertyInsurance';
import { PropertyAnalytics } from '../database/models/PropertyAnalytics';
import { PropertyAuditLog } from '../database/models/PropertyAuditLog';
import {
  REAL_ESTATE_APP_BUNDLE,
  REAL_ESTATE_ROLES,
  DEFAULT_PROPERTY_TYPES,
  TAX_RATE_SALE,
  TAX_RATE_RENT,
  type RealEstateRole,
  type OwnershipType,
} from '../constants/realEstate';
import {
  seedRealEstateRoleConfigs,
  assertRealEstatePermission,
  getRolePermissions,
  updateRolePermissions,
  createDigitalSignature,
} from './realEstateRBACService';
import {
  logRealEstateAction,
  notifyRealEstateUser,
  currentPeriod,
  formatProperty,
  syncPropertyToBusinessAsset,
  recordPropertyRevenue,
  recordPropertyExpense,
  transferPropertyFunds,
  haversineKm,
  getWorldLocation,
  searchIdentity,
} from './realEstateIntegrationService';
import { emitToUser } from './socketService';
import { checkPermission } from './permissionBrokerService';

function id(prefix: string) {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

async function broadcastRealEstate(event: string, data: unknown, userIds?: string[]) {
  if (userIds) {
    for (const uid of userIds) emitToUser(uid, event as never, data);
  } else {
    emitToUser('system', event as never, data);
  }
}

async function getPropertyOrThrow(propertyId: string) {
  const property = await Property.findOne({ propertyId, deletedAt: null });
  if (!property) throw new Error('PROPERTY_NOT_FOUND');
  return property;
}

async function updateAnalytics(userId?: string, companyId?: string, propertyId?: string) {
  const period = currentPeriod();
  const filter: Record<string, unknown> = { deletedAt: null };
  if (propertyId) filter.propertyId = propertyId;
  else if (companyId) filter.companyId = companyId;
  else if (userId) filter.ownerUserId = new Types.ObjectId(userId);

  const properties = await Property.find(
    propertyId ? { propertyId, deletedAt: null }
      : companyId ? { companyId, deletedAt: null }
        : userId ? { ownerUserId: userId, deletedAt: null }
          : { deletedAt: null }
  );

  const marketValue = properties.reduce((s, p) => s + (p.marketValue || p.listPrice), 0);
  const rentals = await PropertyRental.find({ propertyId: { $in: properties.map((p) => p.propertyId) }, deletedAt: null });
  const rentalIncome = rentals.reduce((s, r) => s + r.totalRevenue, 0);
  const maintenance = await PropertyMaintenance.aggregate([
    { $match: { propertyId: { $in: properties.map((p) => p.propertyId) }, deletedAt: null, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$cost' } } },
  ]);
  const maintenanceCost = maintenance[0]?.total ?? 0;
  const occupied = rentals.filter((r) => r.status === 'occupied').length;
  const occupancyRate = rentals.length > 0 ? (occupied / rentals.length) * 100 : 0;
  const profit = rentalIncome - maintenanceCost;

  await PropertyAnalytics.findOneAndUpdate(
    { analyticsId: `AN-${propertyId ?? companyId ?? userId ?? 'global'}-${period}` },
    {
      analyticsId: `AN-${propertyId ?? companyId ?? userId ?? 'global'}-${period}`,
      propertyId,
      companyId,
      ownerUserId: userId ? new Types.ObjectId(userId) : undefined,
      period,
      totalAssets: marketValue,
      marketValue,
      rentalIncome,
      monthlyRevenue: rentalIncome,
      maintenanceCost,
      occupancyRate,
      profit: profit > 0 ? profit : 0,
      loss: profit < 0 ? Math.abs(profit) : 0,
      roi: marketValue > 0 ? (profit / marketValue) * 100 : 0,
      propertyCount: properties.length,
      listedCount: properties.filter((p) => p.status === 'listed' || p.status === 'featured').length,
      soldCount: properties.filter((p) => p.status === 'sold').length,
      rentedCount: properties.filter((p) => p.status === 'rented').length,
      computedAt: new Date(),
    },
    { upsert: true }
  );
}

export async function initializeRealEstate(userId: string, userRole?: string) {
  await seedRealEstateRoleConfigs();

  const hasApp = await checkPermission(userId, REAL_ESTATE_APP_BUNDLE, 'location');
  if (!hasApp && userRole !== 'admin') throw new Error('APP_NOT_INSTALLED');

  const owned = await Property.countDocuments({ ownerUserId: userId, deletedAt: null });
  const favorites = await Property.countDocuments({ favoriteUserIds: userId, deletedAt: null });
  const role: RealEstateRole = userRole === 'admin' ? 'platform_admin' : 'owner';
  const permissions = await getRolePermissions(role);

  emitToUser(userId, 'realestate:initialized', { ownedCount: owned, favoritesCount: favorites, permissions });

  return {
    initialized: true,
    ownedCount: owned,
    favoritesCount: favorites,
    permissions,
    propertyTypes: DEFAULT_PROPERTY_TYPES,
    roles: REAL_ESTATE_ROLES,
  };
}

export async function getDashboard(userId: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'dashboard.view', userRole);

  const owned = await Property.find({ ownerUserId: userId, deletedAt: null }).sort({ updatedAt: -1 }).limit(10);
  const featured = await Property.find({ isFeatured: true, status: { $in: ['listed', 'featured'] }, deletedAt: null }).limit(6);
  const analytics = await PropertyAnalytics.findOne({ ownerUserId: userId, period: currentPeriod() });
  if (!analytics) await updateAnalytics(userId);

  const location = await getWorldLocation(userId).catch(() => null);

  return {
    owned: owned.map(formatProperty),
    featured: featured.map(formatProperty),
    analytics: await PropertyAnalytics.findOne({ ownerUserId: userId, period: currentPeriod() }),
    stats: {
      totalProperties: await Property.countDocuments({ ownerUserId: userId, deletedAt: null }),
      listed: await Property.countDocuments({ ownerUserId: userId, status: { $in: ['listed', 'featured'] }, deletedAt: null }),
      forSale: await Property.countDocuments({ ownerUserId: userId, isAvailable: true, listPrice: { $gt: 0 }, deletedAt: null }),
      forRent: await Property.countDocuments({ ownerUserId: userId, rentPriceMonthly: { $gt: 0 }, deletedAt: null }),
    },
    location,
    permissions: await getRolePermissions(userRole === 'admin' ? 'platform_admin' : 'owner'),
  };
}

export async function listProperties(
  userId: string,
  filters: {
    page?: number; limit?: number; category?: string; status?: string;
    minPrice?: number; maxPrice?: number; bedrooms?: number; bathrooms?: number;
    district?: string; city?: string; companyId?: string; isFeatured?: boolean; isAvailable?: boolean;
  },
  userRole?: string
) {
  await assertRealEstatePermission(userId, 'properties.view', userRole);

  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 20, 100);
  const query: Record<string, unknown> = { deletedAt: null };

  if (filters.category) query.category = filters.category;
  if (filters.status) query.status = filters.status;
  if (filters.district) query['location.district'] = new RegExp(filters.district, 'i');
  if (filters.city) query['location.city'] = new RegExp(filters.city, 'i');
  if (filters.companyId) query.companyId = filters.companyId;
  if (filters.bedrooms) query.bedrooms = { $gte: filters.bedrooms };
  if (filters.bathrooms) query.bathrooms = { $gte: filters.bathrooms };
  if (filters.isFeatured !== undefined) query.isFeatured = filters.isFeatured;
  if (filters.isAvailable !== undefined) query.isAvailable = filters.isAvailable;
  if (filters.minPrice || filters.maxPrice) {
    query.listPrice = {};
    if (filters.minPrice) (query.listPrice as Record<string, number>).$gte = filters.minPrice;
    if (filters.maxPrice) (query.listPrice as Record<string, number>).$lte = filters.maxPrice;
  }

  const [items, total] = await Promise.all([
    Property.find(query).sort({ isFeatured: -1, updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
    Property.countDocuments(query),
  ]);

  return { items: items.map(formatProperty), total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getProperty(userId: string, propertyId: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'properties.view', userRole);
  const property = await getPropertyOrThrow(propertyId);
  property.viewCount += 1;
  await property.save();

  const [images, videos, floorPlans, documents, owners] = await Promise.all([
    PropertyImage.find({ propertyId, deletedAt: null }).sort({ sortOrder: 1 }),
    PropertyVideo.find({ propertyId, deletedAt: null }),
    PropertyFloorPlan.find({ propertyId, deletedAt: null }),
    PropertyDocument.find({ propertyId, deletedAt: null }),
    PropertyOwner.find({ propertyId, deletedAt: null }),
  ]);

  return { ...formatProperty(property), images, videos, floorPlans, documents, owners };
}

export async function createProperty(
  userId: string,
  data: Record<string, unknown>,
  userRole?: string,
  meta?: { ipAddress?: string; deviceUuid?: string }
) {
  await assertRealEstatePermission(userId, 'properties.create', userRole);

  const propertyId = id('PROP');
  const count = await Property.countDocuments();
  const propertyNumber = `RE-${String(count + 1).padStart(6, '0')}`;

  const property = await Property.create({
    propertyId,
    propertyNumber,
    title: data.title,
    description: data.description ?? '',
    category: data.category,
    status: 'pending_approval',
    ownershipType: data.ownershipType ?? 'private',
    ownerUserId: new Types.ObjectId(userId),
    companyId: data.companyId,
    businessOwnerId: data.businessOwnerId,
    developerId: data.developerId,
    builderId: data.builderId,
    location: data.location,
    buildingSize: data.buildingSize ?? 0,
    landSize: data.landSize ?? 0,
    floors: data.floors ?? 1,
    rooms: data.rooms ?? 0,
    bedrooms: data.bedrooms ?? 0,
    bathrooms: data.bathrooms ?? 0,
    kitchens: data.kitchens ?? 1,
    amenities: data.amenities ?? {},
    yearBuilt: data.yearBuilt,
    condition: data.condition ?? 'good',
    energyRating: data.energyRating ?? 'unknown',
    securityLevel: data.securityLevel ?? 'medium',
    utilities: data.utilities ?? {},
    listPrice: data.listPrice ?? 0,
    rentPriceMonthly: data.rentPriceMonthly ?? 0,
    rentPriceWeekly: data.rentPriceWeekly ?? 0,
    rentPriceDaily: data.rentPriceDaily ?? 0,
    marketValue: data.marketValue ?? data.listPrice ?? 0,
    notes: data.notes,
    ownershipHistory: [{
      ownerId: userId,
      ownerType: (data.ownershipType as OwnershipType) ?? 'private',
      userId: new Types.ObjectId(userId),
      companyId: data.companyId as string | undefined,
      sharePercent: 100,
      acquiredAt: new Date(),
    }],
    createdBy: new Types.ObjectId(userId),
  });

  await PropertyOwner.create({
    ownerRecordId: id('OWN'),
    propertyId,
    ownerType: property.ownershipType,
    userId: new Types.ObjectId(userId),
    companyId: property.companyId,
    name: (await User.findById(userId))?.displayName ?? 'Owner',
    sharePercent: 100,
    isPrimary: true,
    createdBy: new Types.ObjectId(userId),
  });

  if (property.rentPriceMonthly > 0) {
    await PropertyRental.create({
      rentalId: id('RENT'),
      propertyId,
      monthlyRent: property.rentPriceMonthly,
      weeklyRent: property.rentPriceWeekly,
      dailyRent: property.rentPriceDaily,
      status: 'available',
      createdBy: new Types.ObjectId(userId),
    });
  }

  if (property.companyId) await syncPropertyToBusinessAsset(property, userId);

  await logRealEstateAction({
    propertyId, userId, actorId: userId, action: 'property_created', resource: 'property', resourceId: propertyId,
    ipAddress: meta?.ipAddress, deviceUuid: meta?.deviceUuid,
  });

  emitToUser(userId, 'realestate:listing:created', { property: formatProperty(property) });
  return formatProperty(property);
}

export async function updateProperty(userId: string, propertyId: string, updates: Record<string, unknown>, userRole?: string, meta?: { ipAddress?: string; deviceUuid?: string }) {
  await assertRealEstatePermission(userId, 'properties.manage', userRole);
  const property = await Property.findOneAndUpdate(
    { propertyId, deletedAt: null },
    { ...updates, updatedBy: new Types.ObjectId(userId) },
    { new: true }
  );
  if (!property) throw new Error('PROPERTY_NOT_FOUND');

  if (updates.listPrice !== undefined || updates.marketValue !== undefined) {
    emitToUser(userId, 'realestate:price:change', { propertyId, listPrice: property.listPrice, marketValue: property.marketValue });
  }

  if (property.companyId) await syncPropertyToBusinessAsset(property, userId);
  await updateAnalytics(property.ownerUserId?.toString(), property.companyId, propertyId);

  emitToUser(userId, 'realestate:listing:updated', { property: formatProperty(property) });
  return formatProperty(property);
}

export async function approveListing(userId: string, propertyId: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'properties.approve', userRole);
  const property = await Property.findOneAndUpdate(
    { propertyId, deletedAt: null },
    { status: 'listed', updatedBy: new Types.ObjectId(userId) },
    { new: true }
  );
  if (!property) throw new Error('PROPERTY_NOT_FOUND');
  emitToUser(userId, 'realestate:listing:updated', { property: formatProperty(property), approved: true });
  return formatProperty(property);
}

export async function featureListing(userId: string, propertyId: string, featured: boolean, userRole?: string) {
  await assertRealEstatePermission(userId, 'properties.feature', userRole);
  const property = await Property.findOneAndUpdate(
    { propertyId, deletedAt: null },
    { isFeatured: featured, status: featured ? 'featured' : 'listed', updatedBy: new Types.ObjectId(userId) },
    { new: true }
  );
  if (!property) throw new Error('PROPERTY_NOT_FOUND');
  return formatProperty(property);
}

export async function archiveListing(userId: string, propertyId: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'properties.archive', userRole);
  const property = await Property.findOneAndUpdate(
    { propertyId, deletedAt: null },
    { status: 'archived', isAvailable: false, updatedBy: new Types.ObjectId(userId) },
    { new: true }
  );
  if (!property) throw new Error('PROPERTY_NOT_FOUND');
  return formatProperty(property);
}

export async function uploadImage(userId: string, propertyId: string, data: { url: string; caption?: string; isPrimary?: boolean }, userRole?: string) {
  await assertRealEstatePermission(userId, 'listings.upload', userRole);
  await getPropertyOrThrow(propertyId);

  const image = await PropertyImage.create({
    imageId: id('IMG'),
    propertyId,
    url: data.url,
    caption: data.caption,
    isPrimary: data.isPrimary ?? false,
    uploadedBy: new Types.ObjectId(userId),
    createdBy: new Types.ObjectId(userId),
  });

  await Property.updateOne({ propertyId }, { $push: { imageIds: image.imageId } });
  return image;
}

export async function uploadFloorPlan(userId: string, propertyId: string, data: { url: string; floor?: number; label?: string }, userRole?: string) {
  await assertRealEstatePermission(userId, 'listings.upload', userRole);
  await getPropertyOrThrow(propertyId);

  const plan = await PropertyFloorPlan.create({
    floorPlanId: id('FP'),
    propertyId,
    url: data.url,
    floor: data.floor ?? 1,
    label: data.label,
    uploadedBy: new Types.ObjectId(userId),
    createdBy: new Types.ObjectId(userId),
  });

  await Property.updateOne({ propertyId }, { $push: { floorPlanIds: plan.floorPlanId } });
  return plan;
}

// Offers
export async function createOffer(userId: string, data: { propertyId: string; amount: number; type: 'purchase' | 'rental'; message?: string }, userRole?: string) {
  await assertRealEstatePermission(userId, 'offers.create', userRole);
  const property = await getPropertyOrThrow(data.propertyId);

  const offer = await PropertyOffer.create({
    offerId: id('OFF'),
    propertyId: data.propertyId,
    buyerUserId: new Types.ObjectId(userId),
    sellerUserId: property.ownerUserId,
    companyId: property.companyId,
    amount: data.amount,
    type: data.type,
    message: data.message,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdBy: new Types.ObjectId(userId),
  });

  property.status = 'under_offer';
  await property.save();

  if (property.ownerUserId) {
    await notifyRealEstateUser(property.ownerUserId.toString(), 'New Offer', `Offer of ₴${data.amount} on ${property.title}`);
    emitToUser(property.ownerUserId.toString(), 'realestate:offer:received', { offerId: offer.offerId, propertyId: data.propertyId, amount: data.amount });
  }

  return offer;
}

export async function counterOffer(userId: string, offerId: string, counterAmount: number, message?: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'offers.negotiate', userRole);
  const offer = await PropertyOffer.findOne({ offerId, deletedAt: null });
  if (!offer) throw new Error('OFFER_NOT_FOUND');

  offer.status = 'countered';
  offer.counterAmount = counterAmount;
  offer.counterBy = new Types.ObjectId(userId);
  offer.negotiationHistory.push({ amount: counterAmount, by: new Types.ObjectId(userId), message, at: new Date() });
  await offer.save();

  emitToUser(offer.buyerUserId.toString(), 'realestate:offer:received', { offerId, counterAmount, status: 'countered' });
  return offer;
}

export async function acceptOffer(userId: string, offerId: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'offers.manage', userRole);
  const offer = await PropertyOffer.findOne({ offerId, deletedAt: null });
  if (!offer) throw new Error('OFFER_NOT_FOUND');

  offer.status = 'accepted';
  await offer.save();

  emitToUser(offer.buyerUserId.toString(), 'realestate:offer:accepted', { offerId, propertyId: offer.propertyId });

  if (offer.type === 'purchase') {
    return completeSale(userId, offer.propertyId, offer.offerId, offer.buyerUserId.toString(), offer.amount, userRole);
  }
  return offer;
}

export async function listOffers(userId: string, propertyId?: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'offers.view', userRole);
  const filter: Record<string, unknown> = { deletedAt: null };
  if (propertyId) filter.propertyId = propertyId;
  return PropertyOffer.find(filter).sort({ createdAt: -1 }).limit(50);
}

// Sales
export async function completeSale(
  userId: string,
  propertyId: string,
  offerId: string | undefined,
  buyerUserId: string,
  salePrice: number,
  userRole?: string
) {
  await assertRealEstatePermission(userId, 'sales.manage', userRole);
  const property = await getPropertyOrThrow(propertyId);
  const taxAmount = salePrice * TAX_RATE_SALE;

  const sale = await PropertySale.create({
    saleId: id('SALE'),
    propertyId,
    offerId,
    buyerUserId: new Types.ObjectId(buyerUserId),
    sellerUserId: property.ownerUserId!,
    companyId: property.companyId,
    salePrice,
    taxAmount,
    escrowAmount: salePrice,
    status: 'in_escrow',
    paymentType: property.companyId ? 'business' : 'cash',
    createdBy: new Types.ObjectId(userId),
  });

  await transferPropertyFunds(
    undefined,
    property.companyId ?? undefined,
    buyerUserId,
    property.ownerUserId?.toString(),
    salePrice - taxAmount,
    `Property sale ${property.title}`,
    sale.saleId
  );

  if (property.companyId) {
    await recordPropertyRevenue(property.companyId, propertyId, salePrice - taxAmount, 'sale', userId);
  }

  property.status = 'sold';
  property.isAvailable = false;
  property.ownerUserId = new Types.ObjectId(buyerUserId);
  property.ownershipHistory.push({
    ownerId: buyerUserId,
    ownerType: 'private',
    userId: new Types.ObjectId(buyerUserId),
    sharePercent: 100,
    acquiredAt: new Date(),
  });
  await property.save();

  sale.status = 'completed';
  sale.completedAt = new Date();
  sale.signatureHash = createDigitalSignature(userId, sale.saleId);
  await sale.save();

  emitToUser(buyerUserId, 'realestate:property:sold', { propertyId, saleId: sale.saleId });
  emitToUser(property.ownerUserId?.toString() ?? userId, 'realestate:property:sold', { propertyId, saleId: sale.saleId });
  await updateAnalytics(buyerUserId, property.companyId, propertyId);

  return sale;
}

export async function listSales(userId: string, propertyId?: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'sales.view', userRole);
  const filter: Record<string, unknown> = { deletedAt: null };
  if (propertyId) filter.propertyId = propertyId;
  return PropertySale.find(filter).sort({ createdAt: -1 }).limit(50);
}

// Rentals & Leases
export async function createLease(
  userId: string,
  data: { propertyId: string; tenantUserId: string; monthlyRent: number; securityDeposit: number; startDate: Date; endDate: Date },
  userRole?: string
) {
  await assertRealEstatePermission(userId, 'leases.create', userRole);
  const property = await getPropertyOrThrow(data.propertyId);

  let rental = await PropertyRental.findOne({ propertyId: data.propertyId, deletedAt: null });
  if (!rental) {
    rental = await PropertyRental.create({
      rentalId: id('RENT'),
      propertyId: data.propertyId,
      monthlyRent: data.monthlyRent,
      securityDeposit: data.securityDeposit,
      status: 'occupied',
      createdBy: new Types.ObjectId(userId),
    });
  }

  let tenant = await PropertyTenant.findOne({ userId: data.tenantUserId, deletedAt: null });
  if (!tenant) {
    const user = await User.findById(data.tenantUserId);
    tenant = await PropertyTenant.create({
      tenantId: id('TEN'),
      userId: new Types.ObjectId(data.tenantUserId),
      name: user?.displayName ?? 'Tenant',
      email: user?.email,
      createdBy: new Types.ObjectId(userId),
    });
  }

  const lease = await PropertyLease.create({
    leaseId: id('LEASE'),
    propertyId: data.propertyId,
    rentalId: rental.rentalId,
    tenantId: tenant.tenantId,
    landlordUserId: property.ownerUserId!,
    companyId: property.companyId,
    monthlyRent: data.monthlyRent,
    securityDeposit: data.securityDeposit,
    startDate: data.startDate,
    endDate: data.endDate,
    status: 'active',
    signatureHash: createDigitalSignature(userId, data.propertyId),
    createdBy: new Types.ObjectId(userId),
  });

  rental.status = 'occupied';
  rental.currentLeaseId = lease.leaseId;
  rental.currentTenantId = tenant.tenantId;
  await rental.save();

  property.status = 'rented';
  property.isAvailable = false;
  await property.save();

  emitToUser(data.tenantUserId, 'realestate:property:rented', { propertyId: data.propertyId, leaseId: lease.leaseId });
  return lease;
}

export async function collectRent(userId: string, leaseId: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'rentals.collect', userRole);
  const lease = await PropertyLease.findOne({ leaseId, deletedAt: null, status: 'active' });
  if (!lease) throw new Error('LEASE_NOT_FOUND');

  const taxAmount = lease.monthlyRent * TAX_RATE_RENT;
  const netRent = lease.monthlyRent - taxAmount;

  await transferPropertyFunds(
    undefined,
    lease.companyId,
    lease.tenantId,
    lease.landlordUserId.toString(),
    netRent,
    `Rent collection ${lease.propertyId}`,
    lease.leaseId
  );

  if (lease.companyId) {
    await recordPropertyRevenue(lease.companyId, lease.propertyId, netRent, 'rent', userId);
  }

  lease.paymentsCollected += lease.monthlyRent;
  await lease.save();

  const rental = await PropertyRental.findOne({ rentalId: lease.rentalId });
  if (rental) {
    rental.totalRevenue += lease.monthlyRent;
    await rental.save();
  }

  return { collected: lease.monthlyRent, netRent, taxAmount };
}

export async function listRentals(userId: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'rentals.view', userRole);
  return PropertyRental.find({ deletedAt: null }).sort({ updatedAt: -1 }).limit(50);
}

export async function listLeases(userId: string, propertyId?: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'leases.view', userRole);
  const filter: Record<string, unknown> = { deletedAt: null };
  if (propertyId) filter.propertyId = propertyId;
  return PropertyLease.find(filter).sort({ createdAt: -1 }).limit(50);
}

// Maintenance
export async function createMaintenance(userId: string, data: Record<string, unknown>, userRole?: string) {
  await assertRealEstatePermission(userId, 'maintenance.create', userRole);
  const maintenance = await PropertyMaintenance.create({
    maintenanceId: id('MAINT'),
    propertyId: data.propertyId,
    type: data.type ?? 'maintenance',
    title: data.title,
    description: data.description ?? '',
    priority: data.priority ?? 'medium',
    cost: data.cost ?? 0,
    requestedBy: new Types.ObjectId(userId),
    createdBy: new Types.ObjectId(userId),
  });

  const property = await Property.findOne({ propertyId: data.propertyId as string });
  if (property?.companyId && (data.cost as number) > 0) {
    await recordPropertyExpense(property.companyId, property.propertyId, data.cost as number, 'maintenance', userId);
  }

  emitToUser(userId, 'realestate:maintenance:update', { maintenanceId: maintenance.maintenanceId, propertyId: data.propertyId });
  return maintenance;
}

export async function listMaintenance(userId: string, propertyId?: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'maintenance.view', userRole);
  const filter: Record<string, unknown> = { deletedAt: null };
  if (propertyId) filter.propertyId = propertyId;
  return PropertyMaintenance.find(filter).sort({ createdAt: -1 }).limit(50);
}

// Inspections
export async function scheduleInspection(userId: string, data: Record<string, unknown>, userRole?: string) {
  await assertRealEstatePermission(userId, 'inspections.schedule', userRole);
  return PropertyInspection.create({
    inspectionId: id('INSP'),
    propertyId: data.propertyId,
    type: data.type ?? 'routine',
    inspectorUserId: new Types.ObjectId(userId),
    scheduledAt: new Date(data.scheduledAt as string),
    findings: '',
    createdBy: new Types.ObjectId(userId),
  });
}

export async function completeInspection(userId: string, inspectionId: string, data: { status: string; findings: string; score?: number }, userRole?: string) {
  await assertRealEstatePermission(userId, 'inspections.manage', userRole);
  const inspection = await PropertyInspection.findOneAndUpdate(
    { inspectionId, deletedAt: null },
    { ...data, completedAt: new Date(), updatedBy: new Types.ObjectId(userId) },
    { new: true }
  );
  if (!inspection) throw new Error('INSPECTION_NOT_FOUND');
  emitToUser(userId, 'realestate:inspection:update', { inspectionId, status: data.status });
  return inspection;
}

// Favorites
export async function toggleFavorite(userId: string, propertyId: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'favorites.manage', userRole);
  const property = await getPropertyOrThrow(propertyId);
  const uid = new Types.ObjectId(userId);
  const isFav = property.favoriteUserIds.some((id) => id.toString() === userId);

  if (isFav) {
    property.favoriteUserIds = property.favoriteUserIds.filter((id) => id.toString() !== userId);
  } else {
    property.favoriteUserIds.push(uid);
  }
  await property.save();
  return { favorited: !isFav, propertyId };
}

export async function listFavorites(userId: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'favorites.manage', userRole);
  const properties = await Property.find({ favoriteUserIds: userId, deletedAt: null });
  return properties.map(formatProperty);
}

// Search
export async function searchProperties(
  userId: string,
  params: {
    query?: string; owner?: string; companyId?: string; district?: string; street?: string;
    minPrice?: number; maxPrice?: number; bedrooms?: number; bathrooms?: number;
    category?: string; isAvailable?: boolean; latitude?: number; longitude?: number; radiusKm?: number;
  },
  userRole?: string
) {
  await assertRealEstatePermission(userId, 'search.advanced', userRole);

  const q: Record<string, unknown> = { deletedAt: null };
  if (params.category) q.category = params.category;
  if (params.companyId) q.companyId = params.companyId;
  if (params.isAvailable !== undefined) q.isAvailable = params.isAvailable;
  if (params.bedrooms) q.bedrooms = { $gte: params.bedrooms };
  if (params.bathrooms) q.bathrooms = { $gte: params.bathrooms };
  if (params.district) q['location.district'] = new RegExp(params.district, 'i');
  if (params.street) q['location.street'] = new RegExp(params.street, 'i');
  if (params.minPrice || params.maxPrice) {
    q.listPrice = {};
    if (params.minPrice) (q.listPrice as Record<string, number>).$gte = params.minPrice;
    if (params.maxPrice) (q.listPrice as Record<string, number>).$lte = params.maxPrice;
  }
  if (params.query) {
    q.$or = [
      { title: new RegExp(params.query, 'i') },
      { propertyNumber: new RegExp(params.query, 'i') },
      { 'location.city': new RegExp(params.query, 'i') },
    ];
  }
  if (params.owner) q.ownerUserId = params.owner;

  let results = await Property.find(q).limit(50);

  if (params.latitude && params.longitude && params.radiusKm) {
    results = results.filter((p) =>
      haversineKm(params.latitude!, params.longitude!, p.location.latitude, p.location.longitude) <= params.radiusKm!
    );
  }

  return results.map(formatProperty);
}

// Analytics
export async function getAnalytics(userId: string, propertyId?: string, companyId?: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'analytics.view', userRole);
  await updateAnalytics(userId, companyId, propertyId);
  const filter: Record<string, unknown> = { period: currentPeriod() };
  if (propertyId) filter.propertyId = propertyId;
  else if (companyId) filter.companyId = companyId;
  else filter.ownerUserId = new Types.ObjectId(userId);
  return PropertyAnalytics.findOne(filter);
}

// RBAC
export async function getRbac(userId: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'rbac.configure', userRole);
  return Promise.all(REAL_ESTATE_ROLES.map(async (role) => ({ role, permissions: await getRolePermissions(role) })));
}

export async function updateRbac(userId: string, role: RealEstateRole, permissions: string[], userRole?: string) {
  await assertRealEstatePermission(userId, 'rbac.configure', userRole);
  return updateRolePermissions(role, permissions as never, userId);
}

export async function getAuditLogs(userId: string, propertyId?: string, userRole?: string) {
  await assertRealEstatePermission(userId, 'audit.view', userRole);
  const filter: Record<string, unknown> = {};
  if (propertyId) filter.propertyId = propertyId;
  return PropertyAuditLog.find(filter).sort({ createdAt: -1 }).limit(100);
}

export { createDigitalSignature };
