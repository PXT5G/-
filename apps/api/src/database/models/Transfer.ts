import mongoose, { Schema, Document, Types } from 'mongoose';

export type TransferStatus = 'pending' | 'completed' | 'cancelled' | 'failed' | 'scheduled';

export interface ITransfer extends Document {
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  fromAccountId: Types.ObjectId;
  toAccountId: Types.ObjectId;
  amount: number;
  currency: string;
  reference: string;
  reason?: string;
  category: string;
  status: TransferStatus;
  debitTransactionId?: Types.ObjectId;
  creditTransactionId?: Types.ObjectId;
  scheduledTransferId?: Types.ObjectId;
  requiresApproval: boolean;
  approvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const transferSchema = new Schema<ITransfer>(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fromAccountId: { type: Schema.Types.ObjectId, ref: 'BankAccount', required: true },
    toAccountId: { type: Schema.Types.ObjectId, ref: 'BankAccount', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'BNA' },
    reference: { type: String, required: true, unique: true },
    reason: { type: String },
    category: { type: String, default: 'transfer' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'failed', 'scheduled'],
      default: 'pending',
      index: true,
    },
    debitTransactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    creditTransactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    scheduledTransferId: { type: Schema.Types.ObjectId, ref: 'ScheduledTransfer' },
    requiresApproval: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Transfer = mongoose.model<ITransfer>('Transfer', transferSchema);

export function generateTransferReference(): string {
  return `TRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
