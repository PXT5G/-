import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { BankAccount } from '../database/models/BankAccount';
import { BankCard } from '../database/models/BankCard';
import { BankTransaction } from '../database/models/BankTransaction';
import { BankTransfer } from '../database/models/BankTransfer';
import {
  BANK_APP_BUNDLE,
  EXPENSE_CATEGORIES,
  type AccountType,
  type TransactionType,
} from '../constants/bank';
import { logAudit } from './auditService';
import { emitToUser } from './socketService';
import {
  assertBankAccess,
  requireBankPermission,
  generatePersonalIBAN,
  generateWalletId,
  generateAccountNumber,
  generateCardLastFour,
  getBankPermissions,
} from './bankRBACService';
import * as bankIntegration from './bankIntegrationService';

function accountId() { return `ACC-${uuidv4().slice(0, 8).toUpperCase()}`; }
function cardId() { return `CRD-${uuidv4().slice(0, 8).toUpperCase()}`; }
function txnId() { return `TXN-${uuidv4().slice(0, 10).toUpperCase()}`; }
function transferId() { return `TRF-${uuidv4().slice(0, 10).toUpperCase()}`; }

export async function initializeBank(userId: string, actorId: string) {
  await assertBankAccess(userId);
  const existing = await BankAccount.countDocuments({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (existing === 0) {
    await provisionDefaultAccounts(userId, actorId);
  }
  await logAudit({ userId, actorId, action: 'bank_initialize', resource: 'bank' });
  const permissions = await getBankPermissions(userId);
  emitToUser(userId, 'bank:initialized', { permissions });
  return { initialized: true, permissions };
}

async function provisionDefaultAccounts(userId: string, actorId: string) {
  const oid = new Types.ObjectId(userId);
  const checking = await BankAccount.create({
    accountId: accountId(),
    userId: oid,
    accountType: 'checking' as AccountType,
    accountNumber: generateAccountNumber(userId),
    iban: generatePersonalIBAN(userId),
    walletId: generateWalletId(userId),
    name: 'Primary Checking',
    availableBalance: 5000,
    isPrimary: true,
    createdBy: new Types.ObjectId(actorId),
  });
  await BankAccount.create({
    accountId: accountId(),
    userId: oid,
    accountType: 'savings' as AccountType,
    accountNumber: generateAccountNumber(`${userId}-sav`),
    iban: generatePersonalIBAN(`${userId}-sav`),
    walletId: generateWalletId(`${userId}-sav`),
    name: 'Savings Account',
    availableBalance: 10000,
    isPrimary: false,
    createdBy: new Types.ObjectId(actorId),
  });
  await BankCard.create({
    cardId: cardId(),
    userId: oid,
    accountId: checking.accountId,
    cardType: 'debit',
    status: 'active',
    lastFour: generateCardLastFour(),
    expiryMonth: 12,
    expiryYear: new Date().getFullYear() + 4,
    holderName: 'Account Holder',
    createdBy: new Types.ObjectId(actorId),
  });
  await recordTransaction(userId, checking.accountId, {
    type: 'deposit',
    amount: 5000,
    description: 'Welcome bonus',
    balanceAfter: 5000,
    actorId,
  });
}

async function recordTransaction(
  userId: string,
  accountIdParam: string,
  params: {
    type: TransactionType;
    amount: number;
    description: string;
    balanceAfter: number;
    reference?: string;
    counterparty?: string;
    category?: string;
    actorId: string;
  }
) {
  const txn = await BankTransaction.create({
    transactionId: txnId(),
    userId: new Types.ObjectId(userId),
    accountId: accountIdParam,
    type: params.type,
    amount: params.amount,
    balanceAfter: params.balanceAfter,
    description: params.description,
    reference: params.reference,
    counterparty: params.counterparty,
    category: params.category,
    createdBy: new Types.ObjectId(params.actorId),
  });
  await bankIntegration.notifyBankTransaction(userId, {
    transactionId: txn.transactionId,
    type: txn.type,
    amount: txn.amount,
    description: txn.description,
  });
  return txn;
}

export async function getDashboard(userId: string) {
  await assertBankAccess(userId);
  const accounts = await BankAccount.find({ userId: new Types.ObjectId(userId), deletedAt: null });
  const cards = await BankCard.find({ userId: new Types.ObjectId(userId), deletedAt: null });
  const totalBalance = accounts.reduce((sum, a) => sum + a.availableBalance, 0);
  const recentTxns = await BankTransaction.find({ userId: new Types.ObjectId(userId), deletedAt: null })
    .sort({ createdAt: -1 }).limit(10);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthlySpending = await BankTransaction.aggregate([
    { $match: { userId: new Types.ObjectId(userId), deletedAt: null, createdAt: { $gte: monthStart },
      type: { $in: ['withdrawal', 'transfer_out', 'payment', 'merchant'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return {
    totalBalance,
    accountCount: accounts.length,
    cardCount: cards.length,
    activeCards: cards.filter((c) => c.status === 'active').length,
    monthlySpending: monthlySpending[0]?.total ?? 0,
    accounts: accounts.map(formatAccount),
    recentTransactions: recentTxns.map(formatTransaction),
  };
}

export async function listAccounts(userId: string) {
  await assertBankAccess(userId);
  const accounts = await BankAccount.find({ userId: new Types.ObjectId(userId), deletedAt: null }).sort({ isPrimary: -1 });
  return accounts.map(formatAccount);
}

export async function getAccount(userId: string, accountIdParam: string) {
  await assertBankAccess(userId);
  const account = await BankAccount.findOne({ accountId: accountIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!account) throw new Error('ACCOUNT_NOT_FOUND');
  return formatAccount(account);
}

export async function listCards(userId: string) {
  await assertBankAccess(userId);
  const cards = await BankCard.find({ userId: new Types.ObjectId(userId), deletedAt: null });
  return cards.map(formatCard);
}

export async function freezeCard(userId: string, cardIdParam: string, actorId: string) {
  await requireBankPermission(userId, 'cards.freeze');
  const card = await BankCard.findOne({ cardId: cardIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!card) throw new Error('CARD_NOT_FOUND');
  card.status = 'frozen';
  card.frozenAt = new Date();
  card.updatedBy = new Types.ObjectId(actorId);
  await card.save();
  await bankIntegration.notifyCardUpdate(userId, formatCard(card));
  await logAudit({ userId, actorId, action: 'bank_card_freeze', resource: 'bank_card', resourceId: cardIdParam });
  return formatCard(card);
}

export async function unfreezeCard(userId: string, cardIdParam: string, actorId: string) {
  await requireBankPermission(userId, 'cards.freeze');
  const card = await BankCard.findOne({ cardId: cardIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!card) throw new Error('CARD_NOT_FOUND');
  card.status = 'active';
  card.frozenAt = undefined;
  card.updatedBy = new Types.ObjectId(actorId);
  await card.save();
  await bankIntegration.notifyCardUpdate(userId, formatCard(card));
  return formatCard(card);
}

export async function listTransactions(userId: string, opts: { accountId?: string; limit?: number; offset?: number; category?: string; search?: string } = {}) {
  await assertBankAccess(userId);
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId), deletedAt: null };
  if (opts.accountId) filter.accountId = opts.accountId;
  if (opts.category) filter.category = opts.category;
  if (opts.search) filter.description = { $regex: opts.search, $options: 'i' };
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  const [transactions, total] = await Promise.all([
    BankTransaction.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit),
    BankTransaction.countDocuments(filter),
  ]);
  return { transactions: transactions.map(formatTransaction), total, limit, offset };
}

export async function internalTransfer(
  userId: string,
  input: { fromAccountId: string; toAccountId: string; amount: number; description: string },
  actorId: string
) {
  await requireBankPermission(userId, 'transfers.internal');
  if (input.amount <= 0) throw new Error('INVALID_AMOUNT');
  const from = await BankAccount.findOne({ accountId: input.fromAccountId, userId: new Types.ObjectId(userId), deletedAt: null });
  const to = await BankAccount.findOne({ accountId: input.toAccountId, deletedAt: null });
  if (!from || !to) throw new Error('ACCOUNT_NOT_FOUND');
  if (from.availableBalance < input.amount) throw new Error('INSUFFICIENT_FUNDS');

  const tid = transferId();
  await bankIntegration.startTransferLiveActivity(userId, tid, input.amount);

  const transfer = await BankTransfer.create({
    transferId: tid,
    userId: new Types.ObjectId(userId),
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    amount: input.amount,
    status: 'processing',
    description: input.description,
    isInternal: true,
    createdBy: new Types.ObjectId(actorId),
  });

  from.availableBalance -= input.amount;
  to.availableBalance += input.amount;
  await from.save();
  await to.save();

  await recordTransaction(userId, from.accountId, {
    type: 'transfer_out', amount: input.amount, description: input.description,
    balanceAfter: from.availableBalance, counterparty: to.name, actorId,
  });
  await recordTransaction(userId, to.accountId, {
    type: 'transfer_in', amount: input.amount, description: input.description,
    balanceAfter: to.availableBalance, counterparty: from.name, actorId,
  });

  transfer.status = 'completed';
  transfer.completedAt = new Date();
  await transfer.save();

  await bankIntegration.notifyBankTransfer(userId, { transferId: tid, amount: input.amount, status: 'completed', description: input.description });
  await bankIntegration.notifyBalanceUpdate(userId, from.accountId, from.availableBalance);
  await bankIntegration.endTransferLiveActivity(userId, tid);
  await logAudit({ userId, actorId, action: 'bank_transfer', resource: 'bank_transfer', resourceId: tid, metadata: input });

  return { transferId: tid, status: 'completed', amount: input.amount };
}

export async function externalTransfer(
  userId: string,
  input: { fromAccountId: string; toIban: string; amount: number; description: string },
  actorId: string
) {
  await requireBankPermission(userId, 'transfers.external');
  if (input.amount <= 0) throw new Error('INVALID_AMOUNT');
  const from = await BankAccount.findOne({ accountId: input.fromAccountId, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!from) throw new Error('ACCOUNT_NOT_FOUND');
  if (from.availableBalance < input.amount) throw new Error('INSUFFICIENT_FUNDS');

  const tid = transferId();
  const transfer = await BankTransfer.create({
    transferId: tid,
    userId: new Types.ObjectId(userId),
    fromAccountId: input.fromAccountId,
    toIban: input.toIban,
    amount: input.amount,
    status: 'completed',
    description: input.description,
    isInternal: false,
    completedAt: new Date(),
    createdBy: new Types.ObjectId(actorId),
  });

  from.availableBalance -= input.amount;
  await from.save();
  await recordTransaction(userId, from.accountId, {
    type: 'transfer_out', amount: input.amount, description: input.description,
    balanceAfter: from.availableBalance, counterparty: input.toIban, actorId,
  });
  await bankIntegration.notifyBankTransfer(userId, { transferId: tid, amount: input.amount, status: 'completed', description: input.description });
  return { transferId: tid, status: 'completed', amount: input.amount };
}

export async function qrPayment(userId: string, input: { fromAccountId: string; amount: number; merchantName: string }, actorId: string) {
  await requireBankPermission(userId, 'transfers.qr');
  if (input.amount <= 0) throw new Error('INVALID_AMOUNT');
  const from = await BankAccount.findOne({ accountId: input.fromAccountId, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!from) throw new Error('ACCOUNT_NOT_FOUND');
  if (from.availableBalance < input.amount) throw new Error('INSUFFICIENT_FUNDS');

  from.availableBalance -= input.amount;
  await from.save();
  const txn = await recordTransaction(userId, from.accountId, {
    type: 'qr_payment',
    amount: input.amount,
    description: `QR Payment: ${input.merchantName}`,
    balanceAfter: from.availableBalance,
    category: 'shopping',
    actorId,
  });
  await bankIntegration.notifyBalanceUpdate(userId, from.accountId, from.availableBalance);
  return { transactionId: txn.transactionId, amount: input.amount, merchantName: input.merchantName };
}

export async function getBudget(userId: string) {
  await assertBankAccess(userId);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const byCategory = await BankTransaction.aggregate([
    { $match: { userId: new Types.ObjectId(userId), deletedAt: null, createdAt: { $gte: monthStart },
      type: { $in: ['withdrawal', 'transfer_out', 'payment', 'merchant'] } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  const categories = EXPENSE_CATEGORIES.map((cat) => {
    const found = byCategory.find((b) => b._id === cat);
    return { category: cat, spent: found?.total ?? 0, transactions: found?.count ?? 0 };
  });
  const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
  return { totalSpent, categories, month: monthStart.toISOString() };
}

export async function getAnalytics(userId: string) {
  await requireBankPermission(userId, 'analytics.view');
  const accounts = await BankAccount.find({ userId: new Types.ObjectId(userId), deletedAt: null });
  const totalBalance = accounts.reduce((s, a) => s + a.availableBalance, 0);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [income, expenses] = await Promise.all([
    BankTransaction.aggregate([
      { $match: { userId: new Types.ObjectId(userId), deletedAt: null, createdAt: { $gte: thirtyDaysAgo },
        type: { $in: ['deposit', 'transfer_in', 'refund', 'interest'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    BankTransaction.aggregate([
      { $match: { userId: new Types.ObjectId(userId), deletedAt: null, createdAt: { $gte: thirtyDaysAgo },
        type: { $in: ['withdrawal', 'transfer_out', 'payment', 'merchant', 'fee'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);
  return {
    totalBalance,
    monthlyIncome: income[0]?.total ?? 0,
    monthlyExpenses: expenses[0]?.total ?? 0,
    cashFlow: (income[0]?.total ?? 0) - (expenses[0]?.total ?? 0),
    accountBreakdown: accounts.map((a) => ({ name: a.name, type: a.accountType, balance: a.availableBalance })),
  };
}

export async function listTransfers(userId: string, opts: { limit?: number; offset?: number; status?: string } = {}) {
  await assertBankAccess(userId);
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId), deletedAt: null };
  if (opts.status) filter.status = opts.status;
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  const transfers = await BankTransfer.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit);
  return transfers.map((t) => ({
    transferId: t.transferId,
    fromAccountId: t.fromAccountId,
    toAccountId: t.toAccountId,
    toIban: t.toIban,
    amount: t.amount,
    status: t.status,
    description: t.description,
    isInternal: t.isInternal,
    completedAt: t.completedAt,
    createdAt: t.createdAt,
  }));
}

function formatAccount(a: InstanceType<typeof BankAccount>) {
  return {
    accountId: a.accountId,
    accountType: a.accountType,
    accountNumber: a.accountNumber,
    iban: a.iban,
    walletId: a.walletId,
    name: a.name,
    currency: a.currency,
    availableBalance: a.availableBalance,
    pendingBalance: a.pendingBalance,
    frozenBalance: a.frozenBalance,
    isPrimary: a.isPrimary,
    isActive: a.isActive,
  };
}

function formatCard(c: InstanceType<typeof BankCard>) {
  return {
    cardId: c.cardId,
    accountId: c.accountId,
    cardType: c.cardType,
    status: c.status,
    lastFour: c.lastFour,
    expiryMonth: c.expiryMonth,
    expiryYear: c.expiryYear,
    holderName: c.holderName,
    dailyLimit: c.dailyLimit,
    monthlyLimit: c.monthlyLimit,
    perTransactionLimit: c.perTransactionLimit,
    isContactless: c.isContactless,
    isVirtual: c.isVirtual,
  };
}

function formatTransaction(t: InstanceType<typeof BankTransaction>) {
  return {
    transactionId: t.transactionId,
    accountId: t.accountId,
    type: t.type,
    amount: t.amount,
    currency: t.currency,
    balanceAfter: t.balanceAfter,
    description: t.description,
    reference: t.reference,
    counterparty: t.counterparty,
    category: t.category,
    merchantName: t.merchantName,
    isFraudulent: t.isFraudulent,
    createdAt: t.createdAt,
  };
}

export { BANK_APP_BUNDLE };
