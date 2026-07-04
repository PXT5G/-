import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { BankAccount } from '../../database/models/BankAccount';
import { BankCard } from '../../database/models/BankCard';
import { Transaction } from '../../database/models/Transaction';
import { Transfer } from '../../database/models/Transfer';
import { Deposit } from '../../database/models/Deposit';
import { Withdrawal } from '../../database/models/Withdrawal';
import { Payment } from '../../database/models/Payment';
import { ScheduledTransfer } from '../../database/models/ScheduledTransfer';
import { Budget } from '../../database/models/Budget';
import { BankSecuritySettings } from '../../database/models/BankSecuritySettings';
import { Notification } from '../../database/models/Notification';
import { Identity } from '../../database/models/Identity';
import {
  provisionBankAccounts,
  getDashboard,
  executeTransfer,
  processDeposit,
  processWithdrawal,
  processPayment,
  generatePaymentQr,
  scanPaymentQr,
  getAnalytics,
  generateStatementPdf,
  generateTransactionsCsv,
  formatAccount,
  formatCard,
  formatTransaction,
  logAudit,
} from '../../services/bankService';

const BANK_APP_ID = 'com.bananaos.bank';

const transferSchema = z.object({
  fromAccountId: z.string(),
  toAccountId: z.string().optional(),
  toAccountNumber: z.string().optional(),
  amount: z.number().min(0.01),
  reason: z.string().max(200).optional(),
  category: z.string().optional(),
});

const depositSchema = z.object({
  accountId: z.string(),
  amount: z.number().min(0.01),
  method: z.enum(['cash', 'manual']).default('manual'),
  notes: z.string().optional(),
});

const withdrawalSchema = z.object({
  accountId: z.string(),
  amount: z.number().min(0.01),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  accountId: z.string(),
  amount: z.number().min(0.01),
  type: z.enum(['bill', 'subscription', 'store', 'membership', 'invoice', 'request']),
  recipient: z.string().min(1),
  description: z.string().min(1),
});

const scheduledSchema = z.object({
  fromAccountId: z.string(),
  toAccountId: z.string().optional(),
  toAccountNumber: z.string().optional(),
  amount: z.number().min(0.01),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly']),
  reason: z.string().optional(),
  nextRunAt: z.string().datetime().optional(),
});

const pinSchema = z.object({ pin: z.string().regex(/^\d{4,6}$/) });

export const provision = asyncHandler(async (req: AuthRequest, res: Response) => {
  const identity = await Identity.findOne({ userId: req.user!.userId });
  if (!identity) throw new AppError(400, 'Identity required. Please create your identity first.');
  if (!identity.verified || identity.status !== 'verified') {
    throw new AppError(403, 'Verified identity required to open bank accounts');
  }
  try {
    const accounts = await provisionBankAccounts(req.user!.userId);
    res.status(201).json({ success: true, data: accounts.map(formatAccount) });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Provisioning failed');
  }
});

export const getAccounts = asyncHandler(async (req: AuthRequest, res: Response) => {
  let accounts = await BankAccount.find({ userId: req.user!.userId });
  if (accounts.length === 0) {
    const identity = await Identity.findOne({ userId: req.user!.userId, status: 'verified', verified: true });
    if (identity) {
      await provisionBankAccounts(req.user!.userId);
      accounts = await BankAccount.find({ userId: req.user!.userId });
    }
  }
  res.json({ success: true, data: accounts.map(formatAccount) });
});

export const getAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const account = await BankAccount.findOne({ _id: String(req.params.id), userId: req.user!.userId });
  if (!account) throw new AppError(404, 'Account not found');
  res.json({ success: true, data: formatAccount(account) });
});

export const updateAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ alias: z.string().min(1).max(50).optional() });
  const data = schema.parse(req.body);
  const account = await BankAccount.findOneAndUpdate(
    { _id: String(req.params.id), userId: req.user!.userId },
    data,
    { new: true }
  );
  if (!account) throw new AppError(404, 'Account not found');
  res.json({ success: true, data: formatAccount(account) });
});

export const getBalance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accounts = await BankAccount.find({ userId: req.user!.userId, status: 'active' });
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  res.json({
    success: true,
    data: { total, currency: 'BNA', accounts: accounts.map((a) => ({ id: a._id.toString(), balance: a.balance, type: a.type })) },
  });
});

export const getDashboardData = asyncHandler(async (req: AuthRequest, res: Response) => {
  let accounts = await BankAccount.find({ userId: req.user!.userId });
  if (accounts.length === 0) {
    const identity = await Identity.findOne({ userId: req.user!.userId, status: 'verified', verified: true });
    if (identity) await provisionBankAccounts(req.user!.userId);
  }
  const dashboard = await getDashboard(req.user!.userId);
  res.json({ success: true, data: dashboard });
});

export const transfer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = transferSchema.parse(req.body);
  if (!data.toAccountId && !data.toAccountNumber) {
    throw new AppError(400, 'Destination account required');
  }
  try {
    const result = await executeTransfer({
      fromUserId: req.user!.userId,
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      toAccountNumber: data.toAccountNumber,
      amount: data.amount,
      reason: data.reason,
      category: data.category,
      performedBy: req.user!.userId,
      performedByRole: req.user!.role,
      ipAddress: req.ip,
    });
    res.status(201).json({
      success: true,
      data: {
        id: result._id.toString(),
        reference: result.reference,
        amount: result.amount,
        status: result.status,
        requiresApproval: result.requiresApproval,
      },
    });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Transfer failed');
  }
});

export const getTransfers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const transfers = await Transfer.find({
    $or: [{ fromUserId: req.user!.userId }, { toUserId: req.user!.userId }],
  }).sort({ createdAt: -1 }).limit(50);
  res.json({
    success: true,
    data: transfers.map((t) => ({
      id: t._id.toString(),
      reference: t.reference,
      amount: t.amount,
      status: t.status,
      reason: t.reason,
      direction: t.fromUserId.toString() === req.user!.userId ? 'out' : 'in',
      createdAt: t.createdAt.toISOString(),
    })),
  });
});

export const deposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = depositSchema.parse(req.body);
  try {
    const result = await processDeposit({
      userId: req.user!.userId,
      accountId: data.accountId,
      amount: data.amount,
      method: data.method,
      performedBy: req.user!.userId,
      performedByRole: req.user!.role,
      notes: data.notes,
      ipAddress: req.ip,
    });
    res.status(201).json({
      success: true,
      data: { id: result._id.toString(), receiptNumber: result.receiptNumber, amount: result.amount, status: result.status },
    });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Deposit failed');
  }
});

export const getDeposits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const deposits = await Deposit.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).limit(50);
  res.json({
    success: true,
    data: deposits.map((d) => ({
      id: d._id.toString(),
      amount: d.amount,
      method: d.method,
      status: d.status,
      receiptNumber: d.receiptNumber,
      createdAt: d.createdAt.toISOString(),
    })),
  });
});

export const withdraw = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = withdrawalSchema.parse(req.body);
  try {
    const result = await processWithdrawal({
      userId: req.user!.userId,
      accountId: data.accountId,
      amount: data.amount,
      performedBy: req.user!.userId,
      performedByRole: req.user!.role,
      notes: data.notes,
      ipAddress: req.ip,
    });
    res.status(201).json({
      success: true,
      data: { id: result._id.toString(), receiptNumber: result.receiptNumber, amount: result.amount, status: result.status },
    });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Withdrawal failed');
  }
});

export const getWithdrawals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const withdrawals = await Withdrawal.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).limit(50);
  res.json({
    success: true,
    data: withdrawals.map((w) => ({
      id: w._id.toString(),
      amount: w.amount,
      status: w.status,
      receiptNumber: w.receiptNumber,
      createdAt: w.createdAt.toISOString(),
    })),
  });
});

export const makePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = paymentSchema.parse(req.body);
  try {
    const result = await processPayment({
      userId: req.user!.userId,
      accountId: data.accountId,
      amount: data.amount,
      type: data.type,
      recipient: data.recipient,
      description: data.description,
      performedBy: req.user!.userId,
      performedByRole: req.user!.role,
      ipAddress: req.ip,
    });
    res.status(201).json({
      success: true,
      data: { id: result._id.toString(), reference: result.reference, amount: result.amount, status: result.status },
    });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Payment failed');
  }
});

export const getPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payments = await Payment.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).limit(50);
  res.json({
    success: true,
    data: payments.map((p) => ({
      id: p._id.toString(),
      amount: p.amount,
      type: p.type,
      recipient: p.recipient,
      status: p.status,
      reference: p.reference,
      createdAt: p.createdAt.toISOString(),
    })),
  });
});

export const createScheduledTransfer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = scheduledSchema.parse(req.body);
  const nextRun = data.nextRunAt ? new Date(data.nextRunAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const scheduled = await ScheduledTransfer.create({
    userId: req.user!.userId,
    fromAccountId: data.fromAccountId,
    toAccountId: data.toAccountId,
    toAccountNumber: data.toAccountNumber,
    amount: data.amount,
    frequency: data.frequency,
    reason: data.reason,
    nextRunAt: nextRun,
    status: 'active',
  });
  res.status(201).json({
    success: true,
    data: { id: scheduled._id.toString(), nextRunAt: scheduled.nextRunAt.toISOString(), status: scheduled.status },
  });
});

export const getScheduledTransfers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const items = await ScheduledTransfer.find({ userId: req.user!.userId }).sort({ nextRunAt: 1 });
  res.json({
    success: true,
    data: items.map((s) => ({
      id: s._id.toString(),
      amount: s.amount,
      frequency: s.frequency,
      status: s.status,
      nextRunAt: s.nextRunAt.toISOString(),
      reason: s.reason,
    })),
  });
});

export const getTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filter: Record<string, unknown> = { userId: req.user!.userId };
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.direction) filter.direction = String(req.query.direction);
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.accountId) filter.accountId = String(req.query.accountId);

  const q = String(req.query.q ?? '').trim();
  if (q.length >= 2) {
    const regex = new RegExp(q, 'i');
    filter.$or = [{ description: regex }, { reference: regex }, { counterpartyName: regex }];
  }

  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const transactions = await Transaction.find(filter).sort({ createdAt: -1 }).limit(limit);
  res.json({ success: true, data: transactions.map(formatTransaction) });
});

export const getTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tx = await Transaction.findOne({ _id: String(req.params.id), userId: req.user!.userId });
  if (!tx) throw new AppError(404, 'Transaction not found');
  res.json({ success: true, data: formatTransaction(tx) });
});

export const exportCsv = asyncHandler(async (req: AuthRequest, res: Response) => {
  const transactions = await Transaction.find({ userId: req.user!.userId, status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(1000);
  const csv = generateTransactionsCsv(transactions);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="banana-bank-transactions.csv"');
  res.send(csv);
});

export const exportStatementPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accountId = String(req.query.accountId ?? '');
  const periodStart = req.query.start ? new Date(String(req.query.start)) : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const periodEnd = req.query.end ? new Date(String(req.query.end)) : new Date();
  const pdf = await generateStatementPdf(req.user!.userId, accountId, periodStart, periodEnd);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="banana-bank-statement.pdf"');
  res.send(pdf);
});

export const generateQr = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ accountId: z.string(), amount: z.number().optional() });
  const data = schema.parse(req.body);
  const qr = await generatePaymentQr(req.user!.userId, data.accountId, data.amount);
  res.json({ success: true, data: qr });
});

export const scanQr = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ payload: z.string(), fromAccountId: z.string() });
  const data = schema.parse(req.body);
  try {
    const transfer = await scanPaymentQr(req.user!.userId, data.fromAccountId, data.payload, req.user!.userId, req.ip);
    res.json({
      success: true,
      data: { reference: transfer.reference, amount: transfer.amount, status: transfer.status },
    });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'QR payment failed');
  }
});

export const getCards = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cards = await BankCard.find({ userId: req.user!.userId });
  res.json({ success: true, data: cards.map(formatCard) });
});

export const freezeCard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const card = await BankCard.findOneAndUpdate(
    { _id: String(req.params.id), userId: req.user!.userId },
    { frozen: true, status: 'frozen' },
    { new: true }
  );
  if (!card) throw new AppError(404, 'Card not found');
  await logAudit(req.user!.userId, 'card_frozen', 'BankCard', req.user!.userId, 'user', card._id.toString());
  res.json({ success: true, data: formatCard(card) });
});

export const unfreezeCard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const card = await BankCard.findOneAndUpdate(
    { _id: String(req.params.id), userId: req.user!.userId },
    { frozen: false, status: 'active' },
    { new: true }
  );
  if (!card) throw new AppError(404, 'Card not found');
  res.json({ success: true, data: formatCard(card) });
});

export const updateCardLimits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ dailyLimit: z.number().optional(), monthlyLimit: z.number().optional() });
  const data = schema.parse(req.body);
  const card = await BankCard.findOneAndUpdate(
    { _id: String(req.params.id), userId: req.user!.userId },
    data,
    { new: true }
  );
  if (!card) throw new AppError(404, 'Card not found');
  res.json({ success: true, data: formatCard(card) });
});

export const setCardPin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = pinSchema.parse(req.body);
  const pinHash = await bcrypt.hash(data.pin, 10);
  await BankCard.findOneAndUpdate({ _id: String(req.params.id), userId: req.user!.userId }, { pinHash });
  res.json({ success: true, message: 'Card PIN set' });
});

export const getAnalyticsData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const period = (req.query.period === 'year' ? 'year' : 'month') as 'month' | 'year';
  const analytics = await getAnalytics(req.user!.userId, period);
  res.json({ success: true, data: analytics });
});

export const getBudgets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const budgets = await Budget.find({ userId: req.user!.userId });
  res.json({
    success: true,
    data: budgets.map((b) => ({
      id: b._id.toString(),
      category: b.category,
      limit: b.limit,
      spent: b.spent,
      period: b.period,
      remaining: Math.max(0, b.limit - b.spent),
    })),
  });
});

export const updateBudget = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ limit: z.number().min(0) });
  const { limit } = schema.parse(req.body);
  const budget = await Budget.findOneAndUpdate(
    { _id: String(req.params.id), userId: req.user!.userId },
    { limit },
    { new: true }
  );
  if (!budget) throw new AppError(404, 'Budget not found');
  res.json({ success: true, data: { id: budget._id.toString(), limit: budget.limit, spent: budget.spent } });
});

export const getSecurity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await BankSecuritySettings.findOne({ userId: req.user!.userId });
  if (!settings) throw new AppError(404, 'Security settings not found');
  res.json({
    success: true,
    data: {
      pinEnabled: settings.pinEnabled,
      twoFactorEnabled: settings.twoFactorEnabled,
      fingerprintEnabled: settings.fingerprintEnabled,
      faceUnlockEnabled: settings.faceUnlockEnabled,
      dailyTransferLimit: settings.dailyTransferLimit,
      singleTransferLimit: settings.singleTransferLimit,
      notifyIncoming: settings.notifyIncoming,
      notifyOutgoing: settings.notifyOutgoing,
      notifySecurity: settings.notifySecurity,
    },
  });
});

export const updateSecurity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    twoFactorEnabled: z.boolean().optional(),
    fingerprintEnabled: z.boolean().optional(),
    faceUnlockEnabled: z.boolean().optional(),
    dailyTransferLimit: z.number().optional(),
    singleTransferLimit: z.number().optional(),
    notifyIncoming: z.boolean().optional(),
    notifyOutgoing: z.boolean().optional(),
    notifySecurity: z.boolean().optional(),
  });
  const settings = await BankSecuritySettings.findOneAndUpdate(
    { userId: req.user!.userId },
    schema.parse(req.body),
    { new: true }
  );
  if (!settings) throw new AppError(404, 'Settings not found');
  res.json({ success: true, data: { pinEnabled: settings.pinEnabled, twoFactorEnabled: settings.twoFactorEnabled } });
});

export const setBankPin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = pinSchema.parse(req.body);
  const pinHash = await bcrypt.hash(data.pin, 10);
  await BankSecuritySettings.findOneAndUpdate(
    { userId: req.user!.userId },
    { pinEnabled: true, pinHash },
    { upsert: true }
  );
  res.json({ success: true, message: 'Bank PIN set' });
});

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notifications = await Notification.find({ userId: req.user!.userId, appId: BANK_APP_ID })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({
    success: true,
    data: notifications.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      body: n.body,
      priority: n.priority,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  });
});

export const requestMoney = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    fromAccountNumber: z.string(),
    amount: z.number().min(0.01),
    reason: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const targetAccount = await BankAccount.findOne({ accountNumber: data.fromAccountNumber });
  if (!targetAccount) throw new AppError(404, 'Account not found');

  const primaryAccount = await BankAccount.findOne({ userId: req.user!.userId, isPrimary: true });
  if (!primaryAccount) throw new AppError(400, 'No primary account');

  const { sendBankNotification } = await import('../../services/bankService');
  await sendBankNotification(
    targetAccount.userId.toString(),
    'Money Request',
    `${req.user!.username} requests ${data.amount} BNA${data.reason ? `: ${data.reason}` : ''}`,
    'normal'
  );

  res.status(201).json({ success: true, message: 'Money request sent' });
});
