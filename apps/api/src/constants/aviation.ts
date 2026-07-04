/** GULF Aviation Marketplace — com.gulfos.aviation constants */

export const AVIATION_APP_BUNDLE = 'com.gulfos.aviation' as const;

export const DEFAULT_AIRCRAFT_CATEGORIES = [
  'private_jet', 'business_jet', 'light_aircraft', 'helicopter', 'medical_helicopter',
  'police_helicopter', 'military_helicopter', 'cargo_plane', 'passenger_plane',
  'training_aircraft', 'seaplane', 'agricultural_aircraft', 'rescue_aircraft',
  'fire_fighting_aircraft', 'drone', 'military_aircraft', 'government_aircraft',
  'vip_aircraft', 'custom_aircraft',
] as const;

export type AircraftCategory = (typeof DEFAULT_AIRCRAFT_CATEGORIES)[number] | string;

export const AIRCRAFT_STATUSES = [
  'draft', 'pending', 'listed', 'reserved', 'under_offer', 'in_auction',
  'sold', 'leased', 'in_maintenance', 'in_transit', 'off_market', 'archived', 'featured',
] as const;
export type AircraftStatus = (typeof AIRCRAFT_STATUSES)[number];

export const AIRPORT_TYPES = [
  'airport', 'private_hangar', 'government_hangar', 'military_base', 'helipad',
] as const;
export type AirportType = (typeof AIRPORT_TYPES)[number] | string;

export const HANGAR_TYPES = ['private', 'government', 'military', 'commercial'] as const;
export const RUNWAY_SURFACES = ['asphalt', 'concrete', 'grass', 'water', 'gravel'] as const;
export const ENGINE_TYPES = ['turbofan', 'turboprop', 'piston', 'electric', 'hybrid', 'jet', 'rotary'] as const;

export const OFFER_STATUSES = ['pending', 'countered', 'accepted', 'rejected', 'expired', 'withdrawn'] as const;
export const SALE_STATUSES = ['pending', 'in_escrow', 'financing', 'completed', 'cancelled'] as const;
export const FINANCE_TYPES = ['cash', 'installment', 'bank_financing', 'leasing', 'trade_in'] as const;
export const AUCTION_STATUSES = ['scheduled', 'active', 'ended', 'cancelled', 'sold'] as const;
export const LEASE_STATUSES = ['draft', 'active', 'expired', 'terminated'] as const;

export const AVIATION_ROLES = [
  'platform_admin', 'company_owner', 'fleet_manager', 'sales_agent', 'finance_officer',
  'pilot', 'mechanic', 'auctioneer', 'buyer', 'seller', 'inspector', 'government_officer',
] as const;
export type AviationRole = (typeof AVIATION_ROLES)[number];

export const AVIATION_PERMISSIONS = [
  'platform.access', 'dashboard.view', 'analytics.view', 'reports.view',
  'aircraft.view', 'aircraft.create', 'aircraft.manage', 'aircraft.delete',
  'aircraft.approve', 'aircraft.archive', 'aircraft.feature', 'aircraft.price', 'aircraft.move',
  'fleet.view', 'fleet.manage', 'inventory.view', 'inventory.import', 'inventory.manage', 'inventory.reserve',
  'dealers.view', 'dealers.create', 'dealers.manage', 'dealers.employees',
  'airports.view', 'airports.create', 'airports.manage',
  'hangars.view', 'hangars.create', 'hangars.manage',
  'runways.view', 'runways.manage',
  'sales.view', 'sales.create', 'sales.manage', 'sales.escrow',
  'offers.view', 'offers.create', 'offers.manage', 'offers.negotiate',
  'finance.view', 'finance.create', 'finance.manage', 'finance.leasing',
  'auctions.view', 'auctions.create', 'auctions.manage', 'auctions.bid',
  'insurance.view', 'insurance.manage',
  'inspections.view', 'inspections.schedule', 'inspections.manage',
  'maintenance.view', 'maintenance.create', 'maintenance.manage',
  'pilots.view', 'pilots.manage', 'mechanics.view', 'mechanics.manage',
  'ownership.transfer', 'ownership.history',
  'bank.view', 'bank.transfer', 'bank.financing', 'bank.installments',
  'search.advanced', 'search.registration', 'search.tail',
  'favorites.manage', 'messages.send', 'media.upload',
  'business.sync', 'business.assets', 'business.revenue',
  'government.view', 'rbac.configure', 'audit.view', 'signatures.create', 'notifications.send',
] as const;

export type AviationPermission = (typeof AVIATION_PERMISSIONS)[number];

export const DEFAULT_AVIATION_ROLE_PERMISSIONS: Record<AviationRole, AviationPermission[]> = {
  platform_admin: [...AVIATION_PERMISSIONS],
  company_owner: AVIATION_PERMISSIONS.filter((p) => p !== 'rbac.configure'),
  fleet_manager: AVIATION_PERMISSIONS.filter((p) =>
    !['rbac.configure', 'dealers.create', 'aircraft.delete'].includes(p)
  ),
  sales_agent: AVIATION_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'aircraft.view', 'aircraft.create', 'inventory.view',
      'sales.view', 'sales.create', 'offers.view', 'offers.create', 'offers.manage', 'offers.negotiate',
      'finance.view', 'search.advanced', 'search.registration', 'favorites.manage',
      'messages.send', 'media.upload', 'notifications.send'].includes(p)
  ),
  finance_officer: AVIATION_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'analytics.view', 'sales.view', 'finance.view',
      'finance.create', 'finance.manage', 'finance.leasing', 'bank.view', 'bank.financing',
      'bank.installments', 'reports.view'].includes(p)
  ),
  pilot: AVIATION_PERMISSIONS.filter((p) =>
    ['platform.access', 'aircraft.view', 'fleet.view', 'aircraft.move', 'airports.view',
      'hangars.view', 'search.advanced'].includes(p)
  ),
  mechanic: AVIATION_PERMISSIONS.filter((p) =>
    ['platform.access', 'aircraft.view', 'maintenance.view', 'maintenance.create', 'maintenance.manage',
      'inspections.view', 'inspections.schedule', 'inspections.manage'].includes(p)
  ),
  auctioneer: AVIATION_PERMISSIONS.filter((p) =>
    ['platform.access', 'aircraft.view', 'auctions.view', 'auctions.create', 'auctions.manage',
      'sales.view', 'offers.view'].includes(p)
  ),
  buyer: ['platform.access', 'dashboard.view', 'aircraft.view', 'offers.view', 'offers.create',
    'auctions.view', 'auctions.bid', 'finance.view', 'search.advanced', 'favorites.manage', 'messages.send'],
  seller: ['platform.access', 'dashboard.view', 'aircraft.view', 'aircraft.create', 'sales.view',
    'offers.view', 'offers.manage', 'ownership.history', 'favorites.manage', 'messages.send'],
  inspector: AVIATION_PERMISSIONS.filter((p) =>
    ['platform.access', 'aircraft.view', 'inspections.view', 'inspections.schedule', 'inspections.manage', 'audit.view'].includes(p)
  ),
  government_officer: AVIATION_PERMISSIONS.filter((p) =>
    ['platform.access', 'aircraft.view', 'airports.view', 'government.view', 'inspections.view', 'audit.view'].includes(p)
  ),
};

export const AVIATION_SOCKET_EVENTS = [
  'aviation:initialized', 'aviation:listed', 'aviation:sold', 'aviation:reserved',
  'aviation:leased', 'aviation:auction', 'aviation:maintenance', 'aviation:moved',
  'aviation:price:change', 'aviation:offer:received', 'aviation:offer:accepted',
  'aviation:notification', 'aviation:analytics:update', 'aviation:finance:update',
] as const;

export const TAX_RATE_SALE = 0.10;
export const TAX_RATE_LEASE = 0.04;
