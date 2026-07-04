/** GULF Marine Marketplace — com.gulfos.marine constants */

export const MARINE_APP_BUNDLE = 'com.gulfos.marine' as const;

export const DEFAULT_VESSEL_CATEGORIES = [
  'fishing_boat', 'speed_boat', 'luxury_yacht', 'mega_yacht', 'jet_ski', 'sail_boat',
  'catamaran', 'cargo_ship', 'container_ship', 'passenger_ferry', 'rescue_boat',
  'police_boat', 'coast_guard_vessel', 'military_vessel', 'submarine', 'work_boat',
  'tug_boat', 'oil_tanker', 'custom_marine_vehicle',
] as const;

export type VesselCategory = (typeof DEFAULT_VESSEL_CATEGORIES)[number] | string;

export const VESSEL_STATUSES = [
  'draft', 'pending', 'listed', 'reserved', 'under_offer', 'in_auction',
  'sold', 'leased', 'in_maintenance', 'in_transit', 'off_market', 'archived', 'featured',
] as const;
export type VesselStatus = (typeof VESSEL_STATUSES)[number];

export const MARINA_TYPES = [
  'marina', 'private_dock', 'public_dock', 'port', 'harbor', 'shipyard', 'boat_storage',
] as const;
export type MarinaType = (typeof MARINA_TYPES)[number] | string;

export const DOCK_TYPES = ['private', 'public', 'commercial', 'government', 'military'] as const;
export const PORT_TYPES = ['commercial', 'cargo', 'passenger', 'fishing', 'military', 'government'] as const;
export const ENGINE_TYPES = ['outboard', 'inboard', 'sterndrive', 'jet', 'diesel', 'electric', 'hybrid', 'sail'] as const;

export const OFFER_STATUSES = ['pending', 'countered', 'accepted', 'rejected', 'expired', 'withdrawn'] as const;
export const SALE_STATUSES = ['pending', 'in_escrow', 'financing', 'completed', 'cancelled'] as const;
export const FINANCE_TYPES = ['cash', 'installment', 'bank_financing', 'leasing', 'trade_in'] as const;
export const AUCTION_STATUSES = ['scheduled', 'active', 'ended', 'cancelled', 'sold'] as const;
export const LEASE_STATUSES = ['draft', 'active', 'expired', 'terminated'] as const;

export const MARINE_ROLES = [
  'platform_admin', 'company_owner', 'fleet_manager', 'sales_agent', 'finance_officer',
  'captain', 'mechanic', 'auctioneer', 'buyer', 'seller', 'inspector', 'government_officer',
] as const;
export type MarineRole = (typeof MARINE_ROLES)[number];

export const MARINE_PERMISSIONS = [
  'platform.access', 'dashboard.view', 'analytics.view', 'reports.view',
  'vessels.view', 'vessels.create', 'vessels.manage', 'vessels.delete',
  'vessels.approve', 'vessels.archive', 'vessels.feature', 'vessels.price', 'vessels.move',
  'fleet.view', 'fleet.manage', 'inventory.view', 'inventory.import', 'inventory.manage', 'inventory.reserve',
  'dealers.view', 'dealers.create', 'dealers.manage', 'dealers.employees',
  'marinas.view', 'marinas.create', 'marinas.manage',
  'docks.view', 'docks.create', 'docks.manage',
  'ports.view', 'ports.create', 'ports.manage',
  'sales.view', 'sales.create', 'sales.manage', 'sales.escrow',
  'offers.view', 'offers.create', 'offers.manage', 'offers.negotiate',
  'finance.view', 'finance.create', 'finance.manage', 'finance.leasing',
  'auctions.view', 'auctions.create', 'auctions.manage', 'auctions.bid',
  'insurance.view', 'insurance.manage',
  'inspections.view', 'inspections.schedule', 'inspections.manage',
  'maintenance.view', 'maintenance.create', 'maintenance.manage',
  'captains.view', 'captains.manage', 'mechanics.view', 'mechanics.manage',
  'ownership.transfer', 'ownership.history',
  'bank.view', 'bank.transfer', 'bank.financing', 'bank.installments',
  'search.advanced', 'search.registration', 'search.hull',
  'favorites.manage', 'messages.send', 'media.upload',
  'business.sync', 'business.assets', 'business.revenue',
  'government.view', 'rbac.configure', 'audit.view', 'signatures.create', 'notifications.send',
] as const;

export type MarinePermission = (typeof MARINE_PERMISSIONS)[number];

export const DEFAULT_MARINE_ROLE_PERMISSIONS: Record<MarineRole, MarinePermission[]> = {
  platform_admin: [...MARINE_PERMISSIONS],
  company_owner: MARINE_PERMISSIONS.filter((p) => p !== 'rbac.configure'),
  fleet_manager: MARINE_PERMISSIONS.filter((p) =>
    !['rbac.configure', 'dealers.create', 'vessels.delete'].includes(p)
  ),
  sales_agent: MARINE_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'vessels.view', 'vessels.create', 'inventory.view',
      'sales.view', 'sales.create', 'offers.view', 'offers.create', 'offers.manage', 'offers.negotiate',
      'finance.view', 'search.advanced', 'search.registration', 'favorites.manage',
      'messages.send', 'media.upload', 'notifications.send'].includes(p)
  ),
  finance_officer: MARINE_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'analytics.view', 'sales.view', 'finance.view',
      'finance.create', 'finance.manage', 'finance.leasing', 'bank.view', 'bank.financing',
      'bank.installments', 'reports.view'].includes(p)
  ),
  captain: MARINE_PERMISSIONS.filter((p) =>
    ['platform.access', 'vessels.view', 'fleet.view', 'vessels.move', 'marinas.view',
      'docks.view', 'ports.view', 'search.advanced'].includes(p)
  ),
  mechanic: MARINE_PERMISSIONS.filter((p) =>
    ['platform.access', 'vessels.view', 'maintenance.view', 'maintenance.create', 'maintenance.manage',
      'inspections.view', 'inspections.schedule', 'inspections.manage'].includes(p)
  ),
  auctioneer: MARINE_PERMISSIONS.filter((p) =>
    ['platform.access', 'vessels.view', 'auctions.view', 'auctions.create', 'auctions.manage',
      'sales.view', 'offers.view'].includes(p)
  ),
  buyer: ['platform.access', 'dashboard.view', 'vessels.view', 'offers.view', 'offers.create',
    'auctions.view', 'auctions.bid', 'finance.view', 'search.advanced', 'favorites.manage', 'messages.send'],
  seller: ['platform.access', 'dashboard.view', 'vessels.view', 'vessels.create', 'sales.view',
    'offers.view', 'offers.manage', 'ownership.history', 'favorites.manage', 'messages.send'],
  inspector: MARINE_PERMISSIONS.filter((p) =>
    ['platform.access', 'vessels.view', 'inspections.view', 'inspections.schedule', 'inspections.manage', 'audit.view'].includes(p)
  ),
  government_officer: MARINE_PERMISSIONS.filter((p) =>
    ['platform.access', 'vessels.view', 'marinas.view', 'ports.view', 'government.view', 'inspections.view', 'audit.view'].includes(p)
  ),
};

export const MARINE_SOCKET_EVENTS = [
  'marine:initialized', 'marine:listed', 'marine:sold', 'marine:reserved',
  'marine:leased', 'marine:auction:started', 'marine:auction:ended',
  'marine:maintenance', 'marine:location:change', 'marine:price:change',
  'marine:offer:received', 'marine:offer:accepted', 'marine:notification',
  'marine:analytics:update', 'marine:finance:update',
] as const;

export const TAX_RATE_SALE = 0.09;
export const TAX_RATE_LEASE = 0.035;
