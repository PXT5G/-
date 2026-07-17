import { BANK_APP_BUNDLE } from '../constants/bank';
import { enqueueNotification } from './notificationBrokerService';
import { emitToUser } from './socketService';
import { createLiveActivity, endLiveActivity } from './liveActivityService';

const transferActivities = new Map<string, string>();

export async function notifyBankTransfer(userId: string, transfer: {
  transferId: string;
  amount: number;
  status: string;
  description: string;
}): Promise<void> {
  await enqueueNotification({
    userId,
    appId: BANK_APP_BUNDLE,
    title: transfer.status === 'completed' ? 'Transfer Complete' : 'Transfer Update',
    body: `${transfer.description}: ${transfer.amount.toLocaleString()} GULF — ${transfer.status}`,
    priority: transfer.status === 'failed' ? 'high' : 'normal',
    groupId: `bank-transfer-${transfer.transferId}`,
    deepLink: `gulfos://bank/transfers/${transfer.transferId}`,
  });
  emitToUser(userId, 'bank:transfer', transfer);
}

export async function notifyBankTransaction(userId: string, transaction: {
  transactionId: string;
  type: string;
  amount: number;
  description: string;
}): Promise<void> {
  emitToUser(userId, 'bank:transaction', transaction);
  if (transaction.amount > 10000) {
    await enqueueNotification({
      userId,
      appId: BANK_APP_BUNDLE,
      title: 'Large Transaction',
      body: `${transaction.description}: ${transaction.amount.toLocaleString()} GULF`,
      priority: 'high',
      groupId: `bank-txn-${transaction.transactionId}`,
    });
  }
}

export async function notifyFraudAlert(userId: string, transactionId: string, reason: string): Promise<void> {
  await enqueueNotification({
    userId,
    appId: BANK_APP_BUNDLE,
    title: 'Fraud Alert',
    body: `Suspicious activity detected: ${reason}`,
    priority: 'critical',
    headsUp: true,
    groupId: `bank-fraud-${transactionId}`,
  });
  emitToUser(userId, 'bank:fraud:alert', { transactionId, reason });
}

export async function startTransferLiveActivity(userId: string, transferId: string, amount: number): Promise<void> {
  const activity = await createLiveActivity(userId, {
    type: 'download',
    title: 'Transfer in Progress',
    subtitle: `${amount.toLocaleString()} GULF`,
    appId: BANK_APP_BUNDLE,
    payload: { transferId },
    dynamicIsland: true,
    lockScreen: true,
  }, userId);
  transferActivities.set(transferId, activity.id);
}

export async function endTransferLiveActivity(userId: string, transferId: string): Promise<void> {
  const activityId = transferActivities.get(transferId);
  if (activityId) {
    await endLiveActivity(userId, activityId, userId);
    transferActivities.delete(transferId);
  }
}

export async function notifyBalanceUpdate(userId: string, accountId: string, balance: number): Promise<void> {
  emitToUser(userId, 'bank:balance', { accountId, balance });
  emitToUser(userId, 'bank:update', { accountId, balance });
}

export async function notifyCardUpdate(userId: string, card: Record<string, unknown>): Promise<void> {
  emitToUser(userId, 'bank:card:update', card);
}

export function buildBankTransferCard(transfer: {
  transferId: string;
  amount: number;
  status: string;
  description: string;
}): Record<string, unknown> {
  return {
    type: 'bank_transfer',
    transferId: transfer.transferId,
    amount: transfer.amount,
    status: transfer.status,
    description: transfer.description,
    appId: BANK_APP_BUNDLE,
  };
}
