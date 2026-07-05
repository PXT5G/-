/** GULF Economy Engine — com.gulfos.economy-engine constants */

export const ECONOMY_APP_BUNDLE = 'com.gulfos.economy-engine' as const;

export const ECONOMY_SECTORS = [
  'real_estate',
  'vehicles',
  'aviation',
  'marine',
  'business_assets',
  'general',
] as const;
export type EconomySector = (typeof ECONOMY_SECTORS)[number];

export const ECONOMY_EVENT_TYPES = [
  'market_boom',
  'market_crash',
  'interest_rate_change',
  'tax_policy',
  'government_stimulus',
  'natural_disaster',
  'trade_agreement',
  'supply_shortage',
  'demand_surge',
  'regulatory_change',
] as const;
export type EconomyEventType = (typeof ECONOMY_EVENT_TYPES)[number];

export const ECONOMY_ROLES = [
  'platform_admin',
  'economist',
  'analyst',
  'auditor',
  'government_officer',
] as const;
export type EconomyRole = (typeof ECONOMY_ROLES)[number];

export const ECONOMY_PERMISSIONS = [
  'platform.access',
  'dashboard.view',
  'reports.view',
  'reports.generate',
  'analytics.view',
  'state.view',
  'state.manage',
  'valuation.view',
  'valuation.recalculate',
  'gdp.view',
  'inflation.view',
  'demand.view',
  'supply.view',
  'events.view',
  'events.create',
  'events.manage',
  'bank.metrics.view',
  'audit.view',
  'tick.trigger',
  'rbac.configure',
] as const;
export type EconomyPermission = (typeof ECONOMY_PERMISSIONS)[number];

export const DEFAULT_ECONOMY_ROLE_PERMISSIONS: Record<EconomyRole, EconomyPermission[]> = {
  platform_admin: [...ECONOMY_PERMISSIONS],
  economist: ECONOMY_PERMISSIONS.filter((p) => !['rbac.configure', 'tick.trigger', 'state.manage'].includes(p)),
  analyst: ECONOMY_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'reports.view', 'analytics.view', 'state.view',
      'valuation.view', 'gdp.view', 'inflation.view', 'demand.view', 'supply.view', 'events.view'].includes(p)
  ),
  auditor: ECONOMY_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'reports.view', 'audit.view', 'valuation.view', 'bank.metrics.view'].includes(p)
  ),
  government_officer: ECONOMY_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'reports.view', 'gdp.view', 'inflation.view',
      'demand.view', 'events.view', 'events.create'].includes(p)
  ),
};

export const ECONOMY_SOCKET_EVENTS = [
  'economy:update',
  'market:update',
  'valuation:update',
  'inflation:update',
  'gdp:update',
] as const;

/** Base annualized profit multiplier for DCF-style valuation */
export const VALUATION_PROFIT_MULTIPLIER = 8;
/** Per-employee intangible value (GULF) */
export const VALUATION_EMPLOYEE_VALUE = 2500;
/** Per-customer intangible value (GULF) */
export const VALUATION_CUSTOMER_VALUE = 150;
/** Inventory discount factor vs book value */
export const VALUATION_INVENTORY_FACTOR = 0.85;
/** Max single-tick price adjustment (±%) */
export const MAX_PRICE_ADJUSTMENT = 0.05;
/** Base interest rate for economy calculations */
export const BASE_INTEREST_RATE = 0.045;
/** Target inflation band */
export const TARGET_INFLATION = 0.02;
/** Hourly tick interval */
export const ECONOMY_TICK_INTERVAL_MS = 60 * 60 * 1000;
