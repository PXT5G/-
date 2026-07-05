/** GULF Real Estate Platform — com.gulfos.real-estate constants */

export const REAL_ESTATE_APP_BUNDLE = 'com.gulfos.real-estate' as const;

export const DEFAULT_PROPERTY_TYPES = [
  'apartment', 'villa', 'house', 'townhouse', 'studio', 'penthouse',
  'hotel', 'resort', 'office_building', 'office_unit', 'warehouse', 'factory',
  'retail_shop', 'shopping_mall', 'restaurant', 'cafe', 'gas_station',
  'hospital', 'school', 'university', 'police_station', 'government_building',
  'airport', 'helipad', 'marina', 'boat_dock', 'parking_lot', 'land', 'farm',
  'industrial_land', 'commercial_land', 'construction_project', 'other',
] as const;

export type PropertyType = (typeof DEFAULT_PROPERTY_TYPES)[number] | string;

export const PROPERTY_STATUSES = [
  'draft', 'pending_approval', 'listed', 'under_offer', 'under_contract',
  'sold', 'rented', 'off_market', 'archived', 'featured',
] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const OWNERSHIP_TYPES = [
  'private', 'business', 'government', 'shared', 'company', 'investment', 'fractional',
] as const;
export type OwnershipType = (typeof OWNERSHIP_TYPES)[number];

export const PROPERTY_CONDITIONS = ['excellent', 'good', 'fair', 'needs_renovation', 'under_construction'] as const;
export const ENERGY_RATINGS = ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'unknown'] as const;
export const SECURITY_LEVELS = ['low', 'medium', 'high', 'maximum'] as const;
export const UTILITY_STATUSES = ['active', 'inactive', 'pending', 'disconnected'] as const;

export const OFFER_STATUSES = ['pending', 'countered', 'accepted', 'rejected', 'expired', 'withdrawn'] as const;
export const SALE_STATUSES = ['pending', 'in_escrow', 'completed', 'cancelled'] as const;
export const LEASE_STATUSES = ['draft', 'active', 'expired', 'terminated', 'renewed'] as const;
export const RENTAL_STATUSES = ['available', 'occupied', 'maintenance', 'eviction_pending'] as const;
export const MAINTENANCE_STATUSES = ['requested', 'scheduled', 'in_progress', 'completed', 'cancelled'] as const;
export const INSPECTION_STATUSES = ['scheduled', 'in_progress', 'passed', 'failed', 'follow_up_required'] as const;

export const REAL_ESTATE_ROLES = [
  'platform_admin', 'dealer', 'agent', 'broker', 'property_manager',
  'owner', 'tenant', 'inspector', 'appraiser', 'investor', 'government_officer',
] as const;
export type RealEstateRole = (typeof REAL_ESTATE_ROLES)[number];

export const REAL_ESTATE_PERMISSIONS = [
  'platform.access', 'dashboard.view', 'analytics.view', 'reports.view',
  'properties.view', 'properties.create', 'properties.manage', 'properties.delete',
  'properties.approve', 'properties.archive', 'properties.feature', 'properties.price',
  'listings.create', 'listings.manage', 'listings.upload',
  'ownership.view', 'ownership.transfer', 'ownership.history',
  'sales.view', 'sales.create', 'sales.manage', 'sales.escrow',
  'offers.view', 'offers.create', 'offers.manage', 'offers.negotiate',
  'rentals.view', 'rentals.create', 'rentals.manage', 'rentals.collect',
  'leases.view', 'leases.create', 'leases.manage', 'leases.evict', 'leases.renew',
  'tenants.view', 'tenants.manage', 'tenants.rate',
  'maintenance.view', 'maintenance.create', 'maintenance.manage',
  'inspections.view', 'inspections.schedule', 'inspections.manage',
  'insurance.view', 'insurance.manage',
  'bank.view', 'bank.mortgage', 'bank.transfer', 'bank.installments',
  'search.advanced', 'search.gps', 'search.nearby',
  'favorites.manage', 'messages.send',
  'government.view', 'government.inspect',
  'business.sync', 'business.assets',
  'rbac.configure', 'audit.view', 'signatures.create', 'notifications.send',
] as const;

export type RealEstatePermission = (typeof REAL_ESTATE_PERMISSIONS)[number];

export const DEFAULT_REAL_ESTATE_ROLE_PERMISSIONS: Record<RealEstateRole, RealEstatePermission[]> = {
  platform_admin: [...REAL_ESTATE_PERMISSIONS],
  dealer: REAL_ESTATE_PERMISSIONS.filter((p) =>
    !['rbac.configure', 'government.inspect', 'leases.evict'].includes(p)
  ),
  agent: REAL_ESTATE_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'analytics.view', 'properties.view', 'properties.create',
      'listings.create', 'listings.manage', 'listings.upload', 'ownership.view', 'sales.view', 'sales.create',
      'offers.view', 'offers.create', 'offers.manage', 'offers.negotiate', 'rentals.view', 'rentals.create',
      'leases.view', 'leases.create', 'tenants.view', 'maintenance.view', 'maintenance.create',
      'search.advanced', 'search.gps', 'search.nearby', 'favorites.manage', 'messages.send',
      'bank.view', 'notifications.send'].includes(p)
  ),
  broker: REAL_ESTATE_PERMISSIONS.filter((p) =>
    !['rbac.configure', 'government.inspect', 'properties.delete'].includes(p)
  ),
  property_manager: REAL_ESTATE_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'analytics.view', 'properties.view', 'properties.manage',
      'rentals.view', 'rentals.manage', 'rentals.collect', 'leases.view', 'leases.manage', 'leases.renew',
      'tenants.view', 'tenants.manage', 'maintenance.view', 'maintenance.create', 'maintenance.manage',
      'inspections.view', 'inspections.schedule', 'insurance.view', 'bank.view', 'search.advanced'].includes(p)
  ),
  owner: REAL_ESTATE_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'analytics.view', 'properties.view', 'properties.create',
      'ownership.view', 'ownership.history', 'sales.view', 'sales.create', 'offers.view', 'offers.manage',
      'rentals.view', 'leases.view', 'maintenance.view', 'maintenance.create', 'bank.view',
      'favorites.manage', 'messages.send'].includes(p)
  ),
  tenant: ['platform.access', 'dashboard.view', 'properties.view', 'rentals.view', 'leases.view',
    'maintenance.view', 'maintenance.create', 'favorites.manage', 'messages.send'],
  inspector: REAL_ESTATE_PERMISSIONS.filter((p) =>
    ['platform.access', 'properties.view', 'inspections.view', 'inspections.schedule', 'inspections.manage',
      'audit.view'].includes(p)
  ),
  appraiser: REAL_ESTATE_PERMISSIONS.filter((p) =>
    ['platform.access', 'properties.view', 'analytics.view', 'properties.price', 'reports.view'].includes(p)
  ),
  investor: REAL_ESTATE_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'analytics.view', 'properties.view', 'ownership.view',
      'sales.view', 'offers.view', 'offers.create', 'bank.view', 'search.advanced', 'favorites.manage'].includes(p)
  ),
  government_officer: REAL_ESTATE_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'properties.view', 'government.view', 'government.inspect',
      'inspections.view', 'inspections.manage', 'audit.view', 'ownership.view', 'ownership.history'].includes(p)
  ),
};

export const REAL_ESTATE_SOCKET_EVENTS = [
  'realestate:initialized', 'realestate:listing:created', 'realestate:listing:updated',
  'realestate:property:sold', 'realestate:property:rented', 'realestate:offer:received',
  'realestate:offer:accepted', 'realestate:maintenance:update', 'realestate:price:change',
  'realestate:notification', 'realestate:analytics:update', 'realestate:escrow:update',
  'realestate:lease:update', 'realestate:inspection:update',
] as const;

export const TAX_RATE_SALE = 0.05;
export const TAX_RATE_RENT = 0.02;
