/** GULF Bank — com.gulfos.bank personal banking constants */

export const BANK_APP_BUNDLE = 'com.gulfos.bank' as const;

export const ACCOUNT_TYPES = ['checking', 'savings', 'wallet', 'business', 'investment'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const CARD_TYPES = ['debit', 'credit', 'virtual'] as const;
export type CardType = (typeof CARD_TYPES)[number];

export const CARD_STATUSES = ['active', 'frozen', 'blocked', 'expired', 'replaced'] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

export const TRANSACTION_TYPES = [
  'deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'payment',
  'qr_payment', 'nfc_payment', 'refund', 'fee', 'interest', 'loan_payment',
  'standing_order', 'scheduled', 'merchant',
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSFER_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'scheduled'] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export const LOAN_STATUSES = ['active', 'paid', 'defaulted', 'restructured'] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const BANK_ROLES = ['account_holder', 'joint_holder', 'authorized_user', 'viewer'] as const;
export type BankRole = (typeof BANK_ROLES)[number];

export const BANK_PERMISSIONS = [
  'platform.access', 'dashboard.view', 'accounts.view', 'accounts.manage',
  'wallet.view', 'wallet.manage', 'cards.view', 'cards.manage', 'cards.freeze',
  'cards.replace', 'cards.limits', 'transactions.view', 'transactions.export',
  'transfers.internal', 'transfers.external', 'transfers.qr', 'transfers.nfc',
  'payments.request', 'payments.scheduled', 'payments.standing',
  'loans.view', 'loans.manage', 'mortgages.view', 'mortgages.manage',
  'savings.view', 'savings.manage', 'investments.view', 'investments.manage',
  'statements.view', 'statements.export', 'budget.view', 'budget.manage',
  'fraud.view', 'biometric.approve', 'merchant.pay', 'analytics.view',
  'audit.view', 'notifications.receive',
] as const;
export type BankPermission = (typeof BANK_PERMISSIONS)[number];

export const DEFAULT_BANK_ROLE_PERMISSIONS: Record<BankRole, BankPermission[]> = {
  account_holder: [...BANK_PERMISSIONS],
  joint_holder: BANK_PERMISSIONS.filter((p) => p !== 'cards.replace' && p !== 'audit.view'),
  authorized_user: BANK_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'accounts.view', 'wallet.view', 'cards.view',
      'transactions.view', 'transfers.internal', 'transfers.qr', 'payments.request',
      'statements.view', 'budget.view', 'notifications.receive'].includes(p)
  ),
  viewer: BANK_PERMISSIONS.filter((p) =>
    ['platform.access', 'dashboard.view', 'accounts.view', 'wallet.view', 'cards.view',
      'transactions.view', 'statements.view', 'budget.view', 'notifications.receive'].includes(p)
  ),
};

export const EXPENSE_CATEGORIES = [
  'housing', 'utilities', 'groceries', 'dining', 'transport', 'healthcare',
  'entertainment', 'shopping', 'education', 'travel', 'insurance', 'investment',
  'business', 'government', 'other',
] as const;

export const BANK_SOCKET_EVENTS = [
  'bank:update', 'bank:transfer', 'bank:transaction', 'bank:card:update',
  'bank:balance', 'bank:fraud:alert', 'bank:payment:completed', 'bank:initialized',
] as const;

export const DEFAULT_CURRENCY = 'GULF' as const;
