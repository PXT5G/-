import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { BankAccount } from '../../database/models/BankAccount';
import { BankCard } from '../../database/models/BankCard';
import { Transfer } from '../../database/models/Transfer';
import { BankAuditLog } from '../../database/models/BankAuditLog';
import { completeTransfer, getAdminStats, processDeposit, logAudit, formatAccount } from '../../services/bankService';

export const getPendingTransfers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const pending = await Transfer.find({ status: 'pending', requiresApproval: true })
    .sort({ createdAt: 1 })
    .limit(50);
  res.json({
    success: true,
    data: pending.map((t) => ({
      id: t._id.toString(),
      reference: t.reference,
      amount: t.amount,
      fromUserId: t.fromUserId.toString(),
      toUserId: t.toUserId.toString(),
      reason: t.reason,
      createdAt: t.createdAt.toISOString(),
    })),
  });
});

export const approveTransfer = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const transfer = await completeTransfer(String(req.params.id), req.user!.userId, 'admin', req.ip);
    res.json({ success: true, data: { id: transfer._id.toString(), reference: transfer.reference, status: transfer.status } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Approval failed');
  }
});

export const rejectTransfer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const transfer = await Transfer.findById(String(req.params.id));
  if (!transfer) throw new AppError(404, 'Transfer not found');
  transfer.status = 'cancelled';
  await transfer.save();
  await logAudit(transfer.fromUserId.toString(), 'transfer_rejected', 'Transfer', req.user!.userId, 'admin', transfer._id.toString());
  res.json({ success: true, message: 'Transfer rejected' });
});

export const freezeAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const account = await BankAccount.findByIdAndUpdate(String(req.params.id), { status: 'frozen' }, { new: true });
  if (!account) throw new AppError(404, 'Account not found');
  await logAudit(account.userId.toString(), 'account_frozen', 'BankAccount', req.user!.userId, 'admin', account._id.toString());
  res.json({ success: true, data: formatAccount(account) });
});

export const unfreezeAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const account = await BankAccount.findByIdAndUpdate(String(req.params.id), { status: 'active' }, { new: true });
  if (!account) throw new AppError(404, 'Account not found');
  await logAudit(account.userId.toString(), 'account_unfrozen', 'BankAccount', req.user!.userId, 'admin', account._id.toString());
  res.json({ success: true, data: formatAccount(account) });
});

export const freezeCardAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const card = await BankCard.findByIdAndUpdate(String(req.params.id), { frozen: true, status: 'frozen' }, { new: true });
  if (!card) throw new AppError(404, 'Card not found');
  res.json({ success: true, message: 'Card frozen' });
});

export const adminDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ accountId: z.string(), amount: z.number().min(0.01), notes: z.string().optional() });
  const data = schema.parse(req.body);
  const account = await BankAccount.findById(data.accountId);
  if (!account) throw new AppError(404, 'Account not found');
  const deposit = await processDeposit({
    userId: account.userId.toString(),
    accountId: data.accountId,
    amount: data.amount,
    method: 'admin',
    performedBy: req.user!.userId,
    performedByRole: 'admin',
    notes: data.notes,
    ipAddress: req.ip,
  });
  res.status(201).json({ success: true, data: { receiptNumber: deposit.receiptNumber, amount: deposit.amount } });
});

export const adminStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const stats = await getAdminStats();
  res.json({ success: true, data: stats });
});

export const adminSearchAccounts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  const filter: Record<string, unknown> = {};
  if (q.length >= 2) {
    const regex = new RegExp(q, 'i');
    filter.$or = [{ accountNumber: regex }, { iban: regex }, { alias: regex }];
  }
  const accounts = await BankAccount.find(filter).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: accounts.map(formatAccount) });
});

export const adminAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 200);
  const logs = await BankAuditLog.find().sort({ createdAt: -1 }).limit(limit);
  res.json({
    success: true,
    data: logs.map((l) => ({
      id: l._id.toString(),
      userId: l.userId.toString(),
      action: l.action,
      entityType: l.entityType,
      details: l.details,
      amount: l.amount,
      performedByRole: l.performedByRole,
      createdAt: l.createdAt.toISOString(),
    })),
  });
});

export const updateAccountLimits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ dailyTransferLimit: z.number().optional(), singleTransferLimit: z.number().optional() });
  const data = schema.parse(req.body);
  const { BankSecuritySettings } = await import('../../database/models/BankSecuritySettings');
  const account = await BankAccount.findById(String(req.params.id));
  if (!account) throw new AppError(404, 'Account not found');
  await BankSecuritySettings.findOneAndUpdate({ userId: account.userId }, data);
  res.json({ success: true, message: 'Limits updated' });
});
