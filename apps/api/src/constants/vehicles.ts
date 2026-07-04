/** GULF Auto Marketplace — com.gulfos.vehicles constants */

export const VEHICLES_APP_BUNDLE = 'com.gulfos.vehicles' as const;

export const DEFAULT_VEHICLE_CATEGORIES = [
  'sedan', 'suv', 'coupe', 'sports', 'supercar', 'hypercar', 'muscle', 'classic',
  'luxury', 'electric', 'hybrid', 'motorcycle', 'truck', 'van', 'bus',
  'emergency', 'police', 'ems', 'government', 'taxi', 'construction',
  'utility', 'military', 'custom',
] as const;

export type VehicleCategory = (typeof DEFAULT_VEHICLE_CATEGORIES)[number] | string;

export const VEHICLE_STATUSES = [
  'draft', 'pending', 'listed', 'reserved', 'under_offer', 'in_auction',
  'sold', 'leased', 'off_market', 'archived', 'featured',
] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const VEHICLE_CONDITIONS = ['excellent', 'good', 'fair', 'poor', 'salvage', 'new'] as const;
export const FUEL_TYPES = ['gasoline', 'diesel', 'electric', 'hybrid', 'hydrogen', 'other'] as const;
export const TRANSMISSION_TYPES = ['manual', 'automatic', 'cvt', 'dct', 'single_speed'] as const;
export const DRIVE_TYPES = ['fwd', 'rwd', 'awd', '4wd'] as const;

export const OFFER_STATUSES = ['pending', 'countered', 'accepted', 'rejected', 'expired', 'withdrawn'] as const;
export const SALE_STATUSES = ['pending', 'in_escrow', 'financing', 'completed', 'cancelled'] as const;
export const FINANCE_TYPES = ['cash', 'installment', 'bank_financing', 'leasing', 'trade_in'] as const;
export const AUCTION_STATUSES = ['scheduled', 'active', 'ended', 'cancelled', 'sold'] as const;
export const LEASE_STATUSES = ['draft', 'active', 'expired', 'terminated'] as const;

export const VEHICLE_ROLES = [
  'platform_admin', 'dealer_owner', 'dealer_manager', 'sales_agent', 'finance_officer',
  'inventory_manager', 'auctioneer', 'buyer', 'seller', 'inspector', 'government_officer',
] as const;
export type VehicleRole = (typeof VEHICLE_ROLES)[number];

export const VEHICLE_PERMISSIONS = [
  'platform.access', 'dashboard.view', 'analytics.view', 'reports.view',
  'vehicles.view', 'vehicles.create', 'vehicles.manage', 'vehicles.delete',
  'vehicles.approve', 'vehicles.archive', 'vehicles.feature', 'vehicles.price',
  'inventory.view', 'inventory.import', 'inventory.manage', 'inventory.reserve',
  'dealers.view', 'dealers.create', 'dealers.manage', 'dealers.employees',
  'sales.view', 'sales.create', 'sales.manage', 'sales.escrow',
  'offers.view', 'offers.create', 'offers.manage', 'offers.negotiate',
  'finance.view', 'finance.create', 'finance.manage', 'finance.leasing',
  'auctions.view', 'auctions.create', 'auctions.manage', 'auctions.bid',
  'insurance.view', 'insurance.manage', 'warranty.view', 'warranty.manage',
  'inspections.view', 'inspections.schedule', 'inspections.manage',
  'maintenance.view', 'maintenance.create', 'maintenance.manage',
  'ownership.transfer', 'ownership.history',
  'bank.view', 'bank.transfer', 'bank.financing', 'bank.installments',
  'search.advanced', 'search.vin', 'search.plate',
  'favorites.manage', 'messages.send', 'media.upload',
  'business.sync', 'business.assets', 'business.revenue',
  'government.view', 'rbac.configure', 'audit.view', 'signatures.create', 'notifications.send',
] as const;

export type VehiclePermission = (typeof VEHICLE_PERMISSIONS)[number];

export const DEFAULT_VEHICLE_ROLE_PERMISSIONS: Record<VehicleRole, VehiclePermission[]> = {
  platform_admin: [...VEHICLE_PERMISSIONS],
  dealer_owner: VEHICLE_PERMISSIONS.filter((p) => p !== 'rbac.configure'),
  dealer_manager: VEHICLE_PERMISSIONS.filter((p) =>
    !['rbac.configure', 'dealers.create', 'vehicles.delete'].includes(p)
  ),
  sales_agent: VEHICLE_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'vehicles.view', 'vehicles.create', 'inventory.view',
      'sales.view', 'sales.create', 'offers.view', 'offers.create', 'offers.manage', 'offers.negotiate',
      'finance.view', 'search.advanced', 'search.vin', 'search.plate', 'favorites.manage',
      'messages.send', 'media.upload', 'notifications.send'].includes(p)
  ),
  finance_officer: VEHICLE_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'analytics.view', 'sales.view', 'finance.view',
      'finance.create', 'finance.manage', 'finance.leasing', 'bank.view', 'bank.financing',
      'bank.installments', 'reports.view'].includes(p)
  ),
  inventory_manager: VEHICLE_PERMISSIONS.filter((p) =>
    ['platform.access', 'vehicles.view', 'vehicles.create', 'vehicles.manage', 'vehicles.price',
      'inventory.view', 'inventory.import', 'inventory.manage', 'inventory.reserve',
      'media.upload', 'inspections.view', 'maintenance.view', 'maintenance.create'].includes(p)
  ),
  auctioneer: VEHICLE_PERMISSIONS.filter((p) =>
    ['platform.access', 'vehicles.view', 'auctions.view', 'auctions.create', 'auctions.manage',
      'sales.view', 'offers.view'].includes(p)
  ),
  buyer: ['platform.access', 'dashboard.view', 'vehicles.view', 'offers.view', 'offers.create',
    'auctions.view', 'auctions.bid', 'finance.view', 'search.advanced', 'favorites.manage', 'messages.send'],
  seller: ['platform.access', 'dashboard.view', 'vehicles.view', 'vehicles.create', 'sales.view',
    'offers.view', 'offers.manage', 'ownership.history', 'favorites.manage', 'messages.send'],
  inspector: VEHICLE_PERMISSIONS.filter((p) =>
    ['platform.access', 'vehicles.view', 'inspections.view', 'inspections.schedule', 'inspections.manage', 'audit.view'].includes(p)
  ),
  government_officer: VEHICLE_PERMISSIONS.filter((p) =>
    ['platform.access', 'vehicles.view', 'government.view', 'inspections.view', 'ownership.view', 'audit.view'].includes(p)
  ),
};

export const VEHICLE_SOCKET_EVENTS = [
  'vehicles:initialized', 'vehicles:listed', 'vehicles:sold', 'vehicles:reserved',
  'vehicles:auction', 'vehicles:inventory:update', 'vehicles:price:change',
  'vehicles:offer:received', 'vehicles:offer:accepted', 'vehicles:notification',
  'vehicles:analytics:update', 'vehicles:finance:update',
] as const;

export const TAX_RATE_SALE = 0.08;
export const TAX_RATE_LEASE = 0.03;
