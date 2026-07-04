import crypto from 'crypto';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { Types } from 'mongoose';
import { Identity } from '../database/models/Identity';
import { BankAccount, IBankAccount, generateAccountNumber, generateIban } from '../database/models/BankAccount';
import { BankCard, IBankCard, generateCardNumber } from '../database/models/BankCard';
import { Transaction, ITransaction, generateReference } from '../database/models/Transaction';
import { Transfer, ITransfer, generateTransferReference } from '../database/models/Transfer';
import { Deposit, IDeposit, generateReceiptNumber } from '../database/models/Deposit';
import { Withdrawal, IWithdrawal, generateWithdrawalReceipt } from '../database/models/Withdrawal';
import { Payment, IPayment } from '../database/models/Payment';
import { ScheduledTransfer, IScheduledTransfer } from '../database/models/ScheduledTransfer';
import { Statement } from '../database/models/Statement';
import { Budget, IBudget } from '../database/models/Budget';
import { BankAuditLog } from '../database/models/BankAuditLog';
import { BankSecuritySettings } from '../database/models/BankSecuritySettings';
import { User } from '../database/models/User';
import { PhoneNumber } from '../database/models/PhoneNumber';
import {
  auditService,
  eventBusService,
  notificationService,
  permissionEngineService,
  BANANAOS_APP_IDS,
} from '../platform';

const BANK_APP_ID = BANANAOS_APP_IDS.BANK;
const FRAUD_THRESHOLD = 5000;
const WELCOME_BONUS = 1000;

export interface PaymentQrPayload {
  v: number;
  type: 'payment';
  accountId: string;
  userId: string;
  accountNumber: string;
  holderName: string;
  amount?: number;
  reference: string;
  sig: string;
}

export async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  performedBy: string,
  performedByRole: string,
  entityId?: string,
  details?: string,
  amount?: number,
  ipAddress?: string
): Promise<void> {
  await auditService.log({
    appId: BANK_APP_ID,
    userId,
    action,
    entityType,
    entityId,
    ctx: { performedBy, performedByRole, ipAddress },
    details,
    amount,
  });

  await BankAuditLog.create({
    userId,
    action,
    entityType,
    entityId: entityId ? new Types.ObjectId(entityId) : undefined,
    details,
    amount,
    performedBy: new Types.ObjectId(performedBy),
    performedByRole,
    ipAddress,
  });
}

export async function sendBankNotification(
  userId: string,
  title: string,
  body: string,
  priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
): Promise<void> {
  await notificationService.send({ userId, appId: BANK_APP_ID, title, body, priority });
}

function buildPaymentSignature(payload: Omit<PaymentQrPayload, 'sig'>): string {
  const data = `${payload.accountId}|${payload.userId}|${payload.accountNumber}|${payload.amount ?? 0}|${payload.reference}`;
  return crypto.createHmac('sha256', process.env.JWT_SECRET ?? 'bananaos-bank').update(data).digest('hex').slice(0, 32);
}

export function formatAccount(account: IBankAccount) {
  return {
    id: account._id.toString(),
    userId: account.userId.toString(),
    identityId: account.identityId.toString(),
    type: account.type,
    accountNumber: account.accountNumber,
    iban: account.iban,
    alias: account.alias,
    balance: account.balance,
    currency: account.currency,
    status: account.status,
    isPrimary: account.isPrimary,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

export function formatCard(card: IBankCard) {
  return {
    id: card._id.toString(),
    accountId: card.accountId.toString(),
    type: card.type,
    cardNumber: `**** **** **** ${card.last4}`,
    last4: card.last4,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
    frozen: card.frozen,
    dailyLimit: card.dailyLimit,
    monthlyLimit: card.monthlyLimit,
    monthlySpent: card.monthlySpent,
    status: card.status,
    holderName: card.holderName,
    createdAt: card.createdAt.toISOString(),
  };
}

export function formatTransaction(tx: ITransaction) {
  return {
    id: tx._id.toString(),
    accountId: tx.accountId.toString(),
    type: tx.type,
    direction: tx.direction,
    amount: tx.amount,
    currency: tx.currency,
    balanceAfter: tx.balanceAfter,
    status: tx.status,
    category: tx.category,
    description: tx.description,
    reference: tx.reference,
    counterpartyName: tx.counterpartyName,
    location: tx.location,
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  };
}

export async function provisionBankAccounts(userId: string): Promise<IBankAccount[]> {
  const existing = await BankAccount.find({ userId });
  if (existing.length > 0) return existing;

  const identity = await Identity.findOne({ userId, status: 'verified', verified: true });
  if (!identity) {
    throw new Error('Verified identity required to open bank accounts');
  }

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const accountTypes: Array<{ type: IBankAccount['type']; alias: string; isPrimary: boolean; balance: number }> = [
    { type: 'current', alias: 'Main Account', isPrimary: true, balance: WELCOME_BONUS },
    { type: 'savings', alias: 'Savings', isPrimary: false, balance: 0 },
    { type: 'wallet', alias: 'Wallet', isPrimary: false, balance: 0 },
    { type: 'business', alias: 'Business', isPrimary: false, balance: 0 },
  ];

  const accounts: IBankAccount[] = [];

  for (const spec of accountTypes) {
    let accountNumber = generateAccountNumber();
    while (await BankAccount.findOne({ accountNumber })) {
      accountNumber = generateAccountNumber();
    }
    const iban = generateIban(accountNumber);

    const account = await BankAccount.create({
      userId,
      identityId: identity._id,
      type: spec.type,
      accountNumber,
      iban,
      alias: spec.alias,
      balance: spec.balance,
      currency: 'BNA',
      status: 'active',
      isPrimary: spec.isPrimary,
    });
    accounts.push(account);

    if (spec.balance > 0) {
      await Transaction.create({
        userId,
        accountId: account._id,
        type: 'deposit',
        direction: 'income',
        amount: spec.balance,
        currency: 'BNA',
        balanceAfter: spec.balance,
        status: 'completed',
        category: 'welcome',
        description: 'Welcome bonus — Banana Bank',
        reference: generateReference(),
      });
    }
  }

  const currentAccount = accounts.find((a) => a.type === 'current')!;
  const cardNumber = generateCardNumber();
  const now = new Date();
  await BankCard.create({
    userId,
    accountId: currentAccount._id,
    type: 'debit',
    cardNumber,
    last4: cardNumber.slice(-4),
    expiryMonth: now.getMonth() + 1,
    expiryYear: now.getFullYear() + 3,
    holderName: identity.fullName,
    dailyLimit: 5000,
    monthlyLimit: 50000,
    status: 'active',
  });

  await BankCard.create({
    userId,
    accountId: currentAccount._id,
    type: 'premium_black',
    cardNumber: generateCardNumber(),
    last4: cardNumber.slice(-4),
    expiryMonth: now.getMonth() + 1,
    expiryYear: now.getFullYear() + 5,
    holderName: identity.fullName,
    dailyLimit: 25000,
    monthlyLimit: 200000,
    status: 'active',
  });

  await BankSecuritySettings.create({ userId });
  await Budget.insertMany([
    { userId, category: 'food', limit: 500, period: 'monthly' },
    { userId, category: 'transport', limit: 300, period: 'monthly' },
    { userId, category: 'entertainment', limit: 200, period: 'monthly' },
    { userId, category: 'utilities', limit: 400, period: 'monthly' },
  ]);

  await logAudit(userId, 'accounts_provisioned', 'BankAccount', userId, 'system', undefined, `Created ${accounts.length} accounts`);
  await sendBankNotification(userId, 'Welcome to Banana Bank', `Your accounts are ready. Welcome bonus of ${WELCOME_BONUS} BNA credited.`, 'high');

  eventBusService.emitToUser(userId, 'bank:accounts:provisioned', { accountCount: accounts.length });
  return accounts;
}

export async function getDashboard(userId: string) {
  const accounts = await BankAccount.find({ userId, status: { $ne: 'closed' } });
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthTx = await Transaction.find({
    userId,
    status: 'completed',
    createdAt: { $gte: startOfMonth },
  });

  const income = monthTx.filter((t) => t.direction === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = monthTx.filter((t) => t.direction === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingsAccount = accounts.find((a) => a.type === 'savings');
  const recentActivity = await Transaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(8);

  return {
    totalBalance,
    totalAssets: totalBalance,
    income,
    expenses,
    savings: savingsAccount?.balance ?? 0,
    investmentOverview: savingsAccount?.balance ?? 0,
    currency: 'BNA',
    accounts: accounts.map(formatAccount),
    recentActivity: recentActivity.map(formatTransaction),
    accountCount: accounts.length,
  };
}

async function checkFraud(userId: string, amount: number): Promise<boolean> {
  if (amount >= FRAUD_THRESHOLD) return true;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await Transfer.countDocuments({
    fromUserId: userId,
    createdAt: { $gte: oneHourAgo },
    status: 'completed',
  });
  return recentCount >= 5;
}

export async function executeTransfer(params: {
  fromUserId: string;
  fromAccountId: string;
  toAccountId?: string;
  toAccountNumber?: string;
  toUserId?: string;
  amount: number;
  reason?: string;
  category?: string;
  performedBy: string;
  performedByRole: string;
  ipAddress?: string;
  skipApproval?: boolean;
}): Promise<ITransfer> {
  const fromAccount = await BankAccount.findOne({ _id: params.fromAccountId, userId: params.fromUserId });
  if (!fromAccount) throw new Error('Source account not found');
  if (fromAccount.status !== 'active') throw new Error('Source account is not active');
  if (fromAccount.balance < params.amount) throw new Error('Insufficient funds');

  let toAccount: IBankAccount | null = null;
  if (params.toAccountId) {
    toAccount = await BankAccount.findById(params.toAccountId);
  } else if (params.toAccountNumber) {
    toAccount = await BankAccount.findOne({ accountNumber: params.toAccountNumber });
  }
  if (!toAccount) throw new Error('Destination account not found');
  if (toAccount.status !== 'active') throw new Error('Destination account is not active');
  if (toAccount._id.toString() === fromAccount._id.toString()) throw new Error('Cannot transfer to same account');

  const settings = await BankSecuritySettings.findOne({ userId: params.fromUserId });
  if (settings && params.amount > settings.singleTransferLimit) {
    throw new Error(`Amount exceeds single transfer limit of ${settings.singleTransferLimit} BNA`);
  }

  const needsApproval = !params.skipApproval && (await checkFraud(params.fromUserId, params.amount));
  const transferRef = generateTransferReference();

  const transfer = await Transfer.create({
    fromUserId: params.fromUserId,
    toUserId: toAccount.userId,
    fromAccountId: fromAccount._id,
    toAccountId: toAccount._id,
    amount: params.amount,
    currency: 'BNA',
    reference: transferRef,
    reason: params.reason,
    category: params.category ?? 'transfer',
    status: needsApproval ? 'pending' : 'pending',
    requiresApproval: needsApproval,
  });

  if (needsApproval) {
    await logAudit(params.fromUserId, 'transfer_flagged', 'Transfer', params.performedBy, params.performedByRole, transfer._id.toString(), 'Fraud detection — pending approval', params.amount, params.ipAddress);
    await sendBankNotification(params.fromUserId, 'Transfer Pending Review', `Transfer of ${params.amount} BNA is under security review.`, 'high');
    return transfer;
  }

  return completeTransfer(transfer._id.toString(), params.performedBy, params.performedByRole, params.ipAddress);
}

export async function completeTransfer(
  transferId: string,
  performedBy: string,
  performedByRole: string,
  ipAddress?: string
): Promise<ITransfer> {
  const transfer = await Transfer.findById(transferId);
  if (!transfer) throw new Error('Transfer not found');
  if (transfer.status === 'completed') return transfer;
  if (transfer.status === 'cancelled' || transfer.status === 'failed') {
    throw new Error('Transfer cannot be completed');
  }

  const fromAccount = await BankAccount.findById(transfer.fromAccountId);
  const toAccount = await BankAccount.findById(transfer.toAccountId);
  if (!fromAccount || !toAccount) throw new Error('Accounts not found');
  if (fromAccount.balance < transfer.amount) {
    transfer.status = 'failed';
    await transfer.save();
    throw new Error('Insufficient funds');
  }

  const fromUser = await User.findById(transfer.fromUserId);
  const toUser = await User.findById(transfer.toUserId);

  fromAccount.balance -= transfer.amount;
  toAccount.balance += transfer.amount;
  await fromAccount.save();
  await toAccount.save();

  const debitRef = generateReference();
  const creditRef = generateReference();

  const debitTx = await Transaction.create({
    userId: transfer.fromUserId,
    accountId: fromAccount._id,
    type: 'transfer_out',
    direction: 'expense',
    amount: transfer.amount,
    currency: 'BNA',
    balanceAfter: fromAccount.balance,
    status: 'completed',
    category: transfer.category,
    description: transfer.reason ?? `Transfer to ${toAccount.alias ?? toAccount.accountNumber}`,
    reference: debitRef,
    counterpartyUserId: transfer.toUserId,
    counterpartyAccountId: toAccount._id,
    counterpartyName: toUser?.displayName,
    relatedId: transfer._id,
    relatedModel: 'Transfer',
  });

  const creditTx = await Transaction.create({
    userId: transfer.toUserId,
    accountId: toAccount._id,
    type: 'transfer_in',
    direction: 'income',
    amount: transfer.amount,
    currency: 'BNA',
    balanceAfter: toAccount.balance,
    status: 'completed',
    category: transfer.category,
    description: transfer.reason ?? `Transfer from ${fromAccount.alias ?? fromAccount.accountNumber}`,
    reference: creditRef,
    counterpartyUserId: transfer.fromUserId,
    counterpartyAccountId: fromAccount._id,
    counterpartyName: fromUser?.displayName,
    relatedId: transfer._id,
    relatedModel: 'Transfer',
  });

  transfer.status = 'completed';
  transfer.debitTransactionId = debitTx._id;
  transfer.creditTransactionId = creditTx._id;
  if (performedByRole === 'admin') transfer.approvedBy = new Types.ObjectId(performedBy);
  await transfer.save();

  await updateBudgetSpent(transfer.fromUserId.toString(), transfer.category, transfer.amount);

  await logAudit(transfer.fromUserId.toString(), 'transfer_completed', 'Transfer', performedBy, performedByRole, transfer._id.toString(), transfer.reference, transfer.amount, ipAddress);
  await logAudit(transfer.toUserId.toString(), 'transfer_received', 'Transfer', performedBy, performedByRole, transfer._id.toString(), transfer.reference, transfer.amount, ipAddress);

  await sendBankNotification(transfer.fromUserId.toString(), 'Transfer Sent', `${transfer.amount} BNA sent. Ref: ${transfer.reference}`, 'normal');
  await sendBankNotification(transfer.toUserId.toString(), 'Money Received', `${transfer.amount} BNA received from ${fromUser?.displayName ?? 'user'}.`, 'high');

  eventBusService.emitToUser(transfer.fromUserId.toString(), 'bank:transfer:complete', { transferId: transfer._id.toString(), amount: transfer.amount, direction: 'out' });
  eventBusService.emitToUser(transfer.toUserId.toString(), 'bank:transfer:complete', { transferId: transfer._id.toString(), amount: transfer.amount, direction: 'in' });
  eventBusService.emitToUser(transfer.fromUserId.toString(), 'bank:balance:updated', { accountId: fromAccount._id.toString(), balance: fromAccount.balance });
  eventBusService.emitToUser(transfer.toUserId.toString(), 'bank:balance:updated', { accountId: toAccount._id.toString(), balance: toAccount.balance });

  return transfer;
}

async function updateBudgetSpent(userId: string, category: string, amount: number): Promise<void> {
  await Budget.findOneAndUpdate(
    { userId, category, period: 'monthly' },
    { $inc: { spent: amount } }
  );
}

export async function processDeposit(params: {
  userId: string;
  accountId: string;
  amount: number;
  method: 'cash' | 'manual' | 'admin';
  performedBy: string;
  performedByRole: string;
  notes?: string;
  ipAddress?: string;
}): Promise<IDeposit> {
  const account = await BankAccount.findOne({ _id: params.accountId, userId: params.userId });
  if (!account) throw new Error('Account not found');
  if (account.status !== 'active') throw new Error('Account is not active');

  const deposit = await Deposit.create({
    userId: params.userId,
    accountId: account._id,
    amount: params.amount,
    method: params.method,
    status: 'completed',
    receiptNumber: generateReceiptNumber(),
    depositedBy: params.performedByRole === 'admin' ? new Types.ObjectId(params.performedBy) : undefined,
    notes: params.notes,
  });

  account.balance += params.amount;
  await account.save();

  const tx = await Transaction.create({
    userId: params.userId,
    accountId: account._id,
    type: 'deposit',
    direction: 'income',
    amount: params.amount,
    currency: 'BNA',
    balanceAfter: account.balance,
    status: 'completed',
    category: params.method,
    description: `${params.method} deposit`,
    reference: generateReference(),
    relatedId: deposit._id,
    relatedModel: 'Deposit',
  });

  deposit.transactionId = tx._id;
  await deposit.save();

  await logAudit(params.userId, 'deposit', 'Deposit', params.performedBy, params.performedByRole, deposit._id.toString(), deposit.receiptNumber, params.amount, params.ipAddress);
  await sendBankNotification(params.userId, 'Deposit Received', `${params.amount} BNA deposited. Receipt: ${deposit.receiptNumber}`, 'normal');
  eventBusService.emitToUser(params.userId, 'bank:balance:updated', { accountId: account._id.toString(), balance: account.balance });

  return deposit;
}

export async function processWithdrawal(params: {
  userId: string;
  accountId: string;
  amount: number;
  performedBy: string;
  performedByRole: string;
  notes?: string;
  ipAddress?: string;
}): Promise<IWithdrawal> {
  const account = await BankAccount.findOne({ _id: params.accountId, userId: params.userId });
  if (!account) throw new Error('Account not found');
  if (account.status !== 'active') throw new Error('Account is not active');
  if (account.balance < params.amount) throw new Error('Insufficient funds');

  const settings = await BankSecuritySettings.findOne({ userId: params.userId });
  if (settings && params.amount > settings.dailyTransferLimit) {
    throw new Error(`Amount exceeds daily limit of ${settings.dailyTransferLimit} BNA`);
  }

  const withdrawal = await Withdrawal.create({
    userId: params.userId,
    accountId: account._id,
    amount: params.amount,
    status: 'completed',
    receiptNumber: generateWithdrawalReceipt(),
    notes: params.notes,
  });

  account.balance -= params.amount;
  await account.save();

  const tx = await Transaction.create({
    userId: params.userId,
    accountId: account._id,
    type: 'withdrawal',
    direction: 'expense',
    amount: params.amount,
    currency: 'BNA',
    balanceAfter: account.balance,
    status: 'completed',
    category: 'withdrawal',
    description: 'Withdrawal',
    reference: generateReference(),
    relatedId: withdrawal._id,
    relatedModel: 'Withdrawal',
  });

  withdrawal.transactionId = tx._id;
  await withdrawal.save();

  await logAudit(params.userId, 'withdrawal', 'Withdrawal', params.performedBy, params.performedByRole, withdrawal._id.toString(), withdrawal.receiptNumber, params.amount, params.ipAddress);
  await sendBankNotification(params.userId, 'Withdrawal Complete', `${params.amount} BNA withdrawn. Receipt: ${withdrawal.receiptNumber}`, 'normal');
  eventBusService.emitToUser(params.userId, 'bank:balance:updated', { accountId: account._id.toString(), balance: account.balance });

  return withdrawal;
}

export async function processPayment(params: {
  userId: string;
  accountId: string;
  amount: number;
  type: IPayment['type'];
  recipient: string;
  description: string;
  performedBy: string;
  performedByRole: string;
  ipAddress?: string;
}): Promise<IPayment> {
  const account = await BankAccount.findOne({ _id: params.accountId, userId: params.userId });
  if (!account) throw new Error('Account not found');
  if (account.balance < params.amount) throw new Error('Insufficient funds');

  const payment = await Payment.create({
    userId: params.userId,
    accountId: account._id,
    amount: params.amount,
    type: params.type,
    recipient: params.recipient,
    description: params.description,
    status: 'completed',
    reference: generateReference(),
  });

  account.balance -= params.amount;
  await account.save();

  const tx = await Transaction.create({
    userId: params.userId,
    accountId: account._id,
    type: 'payment',
    direction: 'expense',
    amount: params.amount,
    currency: 'BNA',
    balanceAfter: account.balance,
    status: 'completed',
    category: params.type,
    description: params.description,
    reference: payment.reference,
    counterpartyName: params.recipient,
    relatedId: payment._id,
    relatedModel: 'Payment',
  });

  payment.transactionId = tx._id;
  await payment.save();

  await updateBudgetSpent(params.userId, params.type, params.amount);
  await logAudit(params.userId, 'payment', 'Payment', params.performedBy, params.performedByRole, payment._id.toString(), params.recipient, params.amount, params.ipAddress);
  await sendBankNotification(params.userId, 'Payment Sent', `${params.amount} BNA paid to ${params.recipient}`, 'normal');
  eventBusService.emitToUser(params.userId, 'bank:balance:updated', { accountId: account._id.toString(), balance: account.balance });

  return payment;
}

export async function generatePaymentQr(
  userId: string,
  accountId: string,
  amount?: number
): Promise<{ payload: string; dataUrl: string }> {
  const account = await BankAccount.findOne({ _id: accountId, userId });
  if (!account) throw new Error('Account not found');

  const identity = await Identity.findOne({ userId });
  const reference = generateReference();

  const qrData: Omit<PaymentQrPayload, 'sig'> = {
    v: 1,
    type: 'payment',
    accountId: account._id.toString(),
    userId,
    accountNumber: account.accountNumber,
    holderName: identity?.fullName ?? 'Banana Bank User',
    amount,
    reference,
  };

  const payload: PaymentQrPayload = { ...qrData, sig: buildPaymentSignature(qrData) };
  const payloadStr = JSON.stringify(payload);
  const dataUrl = await QRCode.toDataURL(payloadStr, { errorCorrectionLevel: 'H', width: 300 });

  return { payload: payloadStr, dataUrl };
}

export async function scanPaymentQr(
  payerUserId: string,
  payerAccountId: string,
  qrPayload: string,
  performedBy: string,
  ipAddress?: string
): Promise<ITransfer> {
  let parsed: PaymentQrPayload;
  try {
    parsed = JSON.parse(qrPayload) as PaymentQrPayload;
  } catch {
    throw new Error('Invalid QR payload');
  }

  const expectedSig = buildPaymentSignature({
    v: parsed.v,
    type: parsed.type,
    accountId: parsed.accountId,
    userId: parsed.userId,
    accountNumber: parsed.accountNumber,
    holderName: parsed.holderName,
    amount: parsed.amount,
    reference: parsed.reference,
  });

  if (parsed.sig !== expectedSig || parsed.type !== 'payment') {
    throw new Error('Invalid payment QR signature');
  }

  const amount = parsed.amount;
  if (!amount || amount <= 0) throw new Error('Payment amount required in QR');

  return executeTransfer({
    fromUserId: payerUserId,
    fromAccountId: payerAccountId,
    toAccountId: parsed.accountId,
    amount,
    reason: `QR Payment — ${parsed.reference}`,
    category: 'qr_payment',
    performedBy,
    performedByRole: 'user',
    ipAddress,
  });
}

export async function getAnalytics(userId: string, period: 'month' | 'year' = 'month') {
  const start = new Date();
  if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  const transactions = await Transaction.find({
    userId,
    status: 'completed',
    createdAt: { $gte: start },
  });

  const income = transactions.filter((t) => t.direction === 'income');
  const expenses = transactions.filter((t) => t.direction === 'expense');

  const categoryBreakdown: Record<string, number> = {};
  expenses.forEach((t) => {
    categoryBreakdown[t.category] = (categoryBreakdown[t.category] ?? 0) + t.amount;
  });

  const monthlyData: { label: string; income: number; expenses: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - i, 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const monthTx = await Transaction.find({
      userId,
      status: 'completed',
      createdAt: { $gte: monthStart, $lt: monthEnd },
    });

    monthlyData.push({
      label: monthStart.toLocaleString('en', { month: 'short' }),
      income: monthTx.filter((t) => t.direction === 'income').reduce((s, t) => s + t.amount, 0),
      expenses: monthTx.filter((t) => t.direction === 'expense').reduce((s, t) => s + t.amount, 0),
    });
  }

  const budgets = await Budget.find({ userId });

  return {
    period,
    totalIncome: income.reduce((s, t) => s + t.amount, 0),
    totalExpenses: expenses.reduce((s, t) => s + t.amount, 0),
    netFlow: income.reduce((s, t) => s + t.amount, 0) - expenses.reduce((s, t) => s + t.amount, 0),
    categoryBreakdown,
    monthlyData,
    budgets: budgets.map((b) => ({
      category: b.category,
      limit: b.limit,
      spent: b.spent,
      remaining: Math.max(0, b.limit - b.spent),
      percentUsed: b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0,
    })),
    insights: generateInsights(income.reduce((s, t) => s + t.amount, 0), expenses.reduce((s, t) => s + t.amount, 0), categoryBreakdown),
  };
}

function generateInsights(income: number, expenses: number, categories: Record<string, number>): string[] {
  const insights: string[] = [];
  if (expenses > income) insights.push('Spending exceeds income this period. Consider reviewing your budget.');
  if (income > 0 && expenses / income < 0.5) insights.push('Great savings rate! You are saving over 50% of your income.');
  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) insights.push(`Highest spending category: ${topCategory[0]} (${topCategory[1].toFixed(2)} BNA)`);
  if (insights.length === 0) insights.push('Your finances are on track. Keep it up!');
  return insights;
}

export async function generateStatementPdf(userId: string, accountId: string, periodStart: Date, periodEnd: Date): Promise<Buffer> {
  const account = await BankAccount.findOne({ _id: accountId, userId });
  if (!account) throw new Error('Account not found');

  const transactions = await Transaction.find({
    userId,
    accountId,
    createdAt: { $gte: periodStart, $lte: periodEnd },
    status: 'completed',
  }).sort({ createdAt: 1 });

  const totalIncome = transactions.filter((t) => t.direction === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.direction === 'expense').reduce((s, t) => s + t.amount, 0);

  await Statement.create({
    userId,
    accountId,
    periodStart,
    periodEnd,
    openingBalance: account.balance - totalIncome + totalExpenses,
    closingBalance: account.balance,
    totalIncome,
    totalExpenses,
    transactionCount: transactions.length,
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.rect(0, 0, doc.page.width, 80).fill('#0A0A0A');
    doc.fillColor('#D4AF37').fontSize(22).text('Banana Bank Statement', 50, 30);
    doc.fillColor('#FFFFFF').fontSize(10).text(`${account.accountNumber} · ${account.iban}`, 50, 58);

    doc.fillColor('#0A0A0A').fontSize(11).text(`Period: ${periodStart.toLocaleDateString()} — ${periodEnd.toLocaleDateString()}`, 50, 100);
    doc.text(`Opening: ${(account.balance - totalIncome + totalExpenses).toFixed(2)} BNA`, 50, 118);
    doc.text(`Closing: ${account.balance.toFixed(2)} BNA`, 50, 134);
    doc.text(`Income: +${totalIncome.toFixed(2)} | Expenses: -${totalExpenses.toFixed(2)}`, 50, 150);

    let y = 180;
    transactions.forEach((tx) => {
      if (y > 700) { doc.addPage(); y = 50; }
      const sign = tx.direction === 'income' ? '+' : '-';
      doc.fontSize(9).fillColor('#666').text(tx.createdAt.toLocaleDateString(), 50, y);
      doc.fillColor('#0A0A0A').text(tx.description.slice(0, 40), 130, y);
      doc.fillColor(tx.direction === 'income' ? '#22c55e' : '#ef4444').text(`${sign}${tx.amount.toFixed(2)}`, 450, y);
      y += 16;
    });

    doc.end();
  });
}

export function generateTransactionsCsv(transactions: ITransaction[]): string {
  const header = 'Date,Reference,Type,Direction,Amount,Balance After,Status,Category,Description\n';
  const rows = transactions.map((tx) =>
    [
      tx.createdAt.toISOString(),
      tx.reference,
      tx.type,
      tx.direction,
      tx.amount,
      tx.balanceAfter,
      tx.status,
      tx.category,
      `"${tx.description.replace(/"/g, '""')}"`,
    ].join(',')
  );
  return header + rows.join('\n');
}

export async function getAdminStats() {
  const [totalAccounts, totalBalance, pendingTransfers, todayTransactions, todayVolume] = await Promise.all([
    BankAccount.countDocuments({ status: 'active' }),
    BankAccount.aggregate([{ $match: { status: 'active' } }, { $group: { _id: null, total: { $sum: '$balance' } } }]),
    Transfer.countDocuments({ status: 'pending', requiresApproval: true }),
    Transaction.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }, status: 'completed' }),
    Transaction.aggregate([
      { $match: { createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  return {
    totalAccounts,
    totalBalance: totalBalance[0]?.total ?? 0,
    pendingTransfers,
    todayTransactions,
    todayVolume: todayVolume[0]?.total ?? 0,
  };
}
