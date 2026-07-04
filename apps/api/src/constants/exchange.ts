/** GULF Exchange — com.gulfos.exchange constants */

export const EXCHANGE_APP_BUNDLE = 'com.gulfos.exchange' as const;
export const EXCHANGE_ID = 'GULFX' as const;

export const LISTED_COMPANY_TYPES = [
  'public', 'private', 'government', 'investment', 'holding', 'bank',
  'industrial', 'retail', 'technology', 'real_estate', 'vehicle_dealership',
  'airline', 'marine', 'construction', 'healthcare', 'media', 'custom',
] as const;
export type ListedCompanyType = (typeof LISTED_COMPANY_TYPES)[number] | string;

export const STOCK_SECTORS = [
  'technology', 'finance', 'real_estate', 'automotive', 'aviation', 'marine',
  'healthcare', 'energy', 'retail', 'industrial', 'media', 'government', 'utilities', 'other',
] as const;
export type StockSector = (typeof STOCK_SECTORS)[number] | string;

export const TRADING_STATUSES = ['active', 'halted', 'suspended', 'delisted', 'ipo_pending'] as const;
export type TradingStatus = (typeof TRADING_STATUSES)[number];

export const ORDER_TYPES = ['market', 'limit', 'stop', 'stop_limit'] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_SIDES = ['buy', 'sell'] as const;
export type OrderSide = (typeof ORDER_SIDES)[number];

export const ORDER_STATUSES = ['pending', 'partial', 'filled', 'cancelled', 'expired', 'rejected'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const IPO_STATUSES = [
  'applied', 'under_review', 'approved', 'rejected', 'scheduled', 'listed', 'withdrawn',
] as const;
export type IpoStatus = (typeof IPO_STATUSES)[number];

export const CORPORATE_ACTION_TYPES = [
  'stock_split', 'reverse_split', 'trading_halt', 'merger', 'acquisition',
  'delisting', 'relisting', 'share_buyback', 'new_share_issue',
] as const;

export const DIVIDEND_TYPES = ['quarterly', 'special', 'annual'] as const;

export const NEWS_CATEGORIES = [
  'market', 'company', 'government', 'ipo', 'dividend', 'economic', 'corporate_action',
] as const;

export const MARKET_INDEX_IDS = ['GULF20', 'GULF-BIZ', 'GULF-PROP', 'GULF-AUTO', 'GULF-AVIA', 'GULF-MAR'] as const;

export const EXCHANGE_ROLES = [
  'exchange_admin', 'market_supervisor', 'company_representative', 'broker',
  'investor', 'auditor', 'government_officer', 'read_only',
] as const;
export type ExchangeRole = (typeof EXCHANGE_ROLES)[number];

export const EXCHANGE_PERMISSIONS = [
  'platform.access', 'dashboard.view', 'analytics.view', 'reports.view',
  'stocks.view', 'stocks.trade', 'stocks.manage',
  'orders.view', 'orders.create', 'orders.cancel', 'orders.manage',
  'portfolio.view', 'portfolio.manage', 'portfolio.transfer',
  'watchlist.manage', 'news.view', 'news.create', 'news.manage',
  'ipo.view', 'ipo.apply', 'ipo.review', 'ipo.approve', 'ipo.manage',
  'indexes.view', 'indexes.manage',
  'dividends.view', 'dividends.distribute', 'dividends.manage',
  'corporate_actions.view', 'corporate_actions.create', 'corporate_actions.manage',
  'listed_companies.view', 'listed_companies.manage',
  'fraud.view', 'fraud.investigate',
  'bank.view', 'bank.transfer', 'bank.statements',
  'search.advanced', 'audit.view', 'rbac.configure', 'notifications.send',
] as const;
export type ExchangePermission = (typeof EXCHANGE_PERMISSIONS)[number];

export const DEFAULT_EXCHANGE_ROLE_PERMISSIONS: Record<ExchangeRole, ExchangePermission[]> = {
  exchange_admin: [...EXCHANGE_PERMISSIONS],
  market_supervisor: EXCHANGE_PERMISSIONS.filter((p) => !['rbac.configure'].includes(p)),
  company_representative: EXCHANGE_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'stocks.view', 'portfolio.view', 'orders.view',
      'ipo.view', 'ipo.apply', 'news.view', 'dividends.view', 'corporate_actions.view',
      'listed_companies.view', 'search.advanced', 'notifications.send'].includes(p)
  ),
  broker: EXCHANGE_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'stocks.view', 'stocks.trade', 'orders.view',
      'orders.create', 'orders.cancel', 'portfolio.view', 'portfolio.manage', 'watchlist.manage',
      'news.view', 'search.advanced', 'bank.view', 'notifications.send'].includes(p)
  ),
  investor: EXCHANGE_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'stocks.view', 'stocks.trade', 'orders.view',
      'orders.create', 'orders.cancel', 'portfolio.view', 'portfolio.manage', 'watchlist.manage',
      'news.view', 'search.advanced', 'bank.view', 'bank.statements', 'notifications.send'].includes(p)
  ),
  auditor: EXCHANGE_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'reports.view', 'audit.view', 'fraud.view',
      'orders.view', 'portfolio.view', 'listed_companies.view'].includes(p)
  ),
  government_officer: EXCHANGE_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'ipo.view', 'ipo.review', 'ipo.approve',
      'news.view', 'news.create', 'fraud.view', 'listed_companies.view', 'audit.view'].includes(p)
  ),
  read_only: EXCHANGE_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'stocks.view', 'orders.view', 'portfolio.view',
      'news.view', 'indexes.view', 'search.advanced'].includes(p)
  ),
};

export const EXCHANGE_SOCKET_EVENTS = [
  'exchange:update', 'stock:update', 'trade:update', 'portfolio:update',
  'order:update', 'dividend:update', 'market:update', 'news:update',
] as const;

/** Max order book price impact per tick (±%) */
export const MAX_ORDER_BOOK_IMPACT = 0.03;
/** Default shares per IPO */
export const DEFAULT_OUTSTANDING_SHARES = 1_000_000;
/** Trading fee rate */
export const TRADING_FEE_RATE = 0.001;
/** Large transaction alert threshold (GULF) */
export const LARGE_TRADE_THRESHOLD = 100_000;
