import mongoose, { Schema, Document, Types } from 'mongoose';
import type { TransferStatus } from '../../constants/bank';
import { auditSchemaFields } from '../baseSchema';

export interface IBankTransfer extends Document {
  transferId: string;
  userId: Types.ObjectId;
  fromAccountId: string;
  toAccountId?: string;
  toIban?: string;
  toWalletId?: string;
  amount: number;
  currency: string;
  status: TransferStatus;
  description: string;
  reference?: string;
  isInternal: boolean;
  isQrPayment: boolean;
  isNfcPayment: boolean;
  scheduledAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  requiresBiometric: boolean;
  approvedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const bankTransferSchema = new Schema<IBankTransfer>(
  {
    transferId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fromAccountId: { type: String, required: true, index: true },
    toAccountId: String,
    toIban: String,
    toWalletId: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: 'GULF' },
    status: { type: String, required: true, default: 'pending', index: true },
    description: { type: String, required: true },
    reference: String,
    isInternal: { type: Boolean, default: true },
    isQrPayment: { type: Boolean, default: false },
    isNfcPayment: { type: Boolean, default: false },
    scheduledAt: Date,
    completedAt: Date,
    failureReason: String,
    requiresBiometric: { type: Boolean, default: false },
    approvedAt: Date,
    ...auditSchemaFields,
  },
  { timestamps: true }
);

bankTransferSchema.index({ userId: 1, createdAt: -1 });
bankTransferSchema.index({ userId: 1, status: 1 });

export const BankTransfer = mongoose.model<IBankTransfer>('BankTransfer', bankTransferSchema);
