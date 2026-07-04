export type AccountType = 'current' | 'savings' | 'business' | 'wallet';
export type AccountStatus = 'active' | 'frozen' | 'suspended' | 'closed';
export type CardType = 'debit' | 'credit' | 'premium_black';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'failed';
export type BankTab = 'home' | 'accounts' | 'cards' | 'transfer' | 'history' | 'analytics' | 'payments' | 'security' | 'notifications' | 'admin';

export interface BankAccount {
  id: string;
  userId: string;
  identityId: string;
  type: AccountType;
  accountNumber: string;
  iban: string;
  alias?: string;
  balance: number;
  currency: string;
  status: AccountStatus;
  isPrimary: boolean;
  createdAt: string;
}

export interface BankCard {
  id: string;
  accountId: string;
  type: CardType;
  cardNumber: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  frozen: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  monthlySpent: number;
  status: string;
  holderName: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: string;
  direction: 'income' | 'expense';
  amount: number;
  currency: string;
  balanceAfter: number;
  status: TransactionStatus;
  category: string;
  description: string;
  reference: string;
  counterpartyName?: string;
  createdAt: string;
}

export interface Dashboard {
  totalBalance: number;
  totalAssets: number;
  income: number;
  expenses: number;
  savings: number;
  investmentOverview: number;
  currency: string;
  accounts: BankAccount[];
  recentActivity: Transaction[];
  accountCount: number;
}

export interface TransferResult {
  id: string;
  reference: string;
  amount: number;
  status: string;
  requiresApproval?: boolean;
}

export interface Analytics {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  categoryBreakdown: Record<string, number>;
  monthlyData: { label: string; income: number; expenses: number }[];
  budgets: { category: string; limit: number; spent: number; remaining: number; percentUsed: number }[];
  insights: string[];
}

export interface BankNotification {
  id: string;
  title: string;
  body: string;
  priority: string;
  read: boolean;
  createdAt: string;
}

export interface BankSecurity {
  pinEnabled: boolean;
  twoFactorEnabled: boolean;
  fingerprintEnabled: boolean;
  faceUnlockEnabled: boolean;
  dailyTransferLimit: number;
  singleTransferLimit: number;
  notifyIncoming: boolean;
  notifyOutgoing: boolean;
  notifySecurity: boolean;
}

export interface AdminStats {
  totalAccounts: number;
  totalBalance: number;
  pendingTransfers: number;
  todayTransactions: number;
  todayVolume: number;
}
