import mongoose, { Schema, Document, Types } from 'mongoose';

export type TransferFrequency = 'once' | 'daily' | 'weekly' | 'monthly';
export type ScheduledStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface IScheduledTransfer extends Document {
  userId: Types.ObjectId;
  fromAccountId: Types.ObjectId;
  toAccountId?: Types.ObjectId;
  toUserId?: Types.ObjectId;
  toAccountNumber?: string;
  amount: number;
  currency: string;
  frequency: TransferFrequency;
  reason?: string;
  nextRunAt: Date;
  lastRunAt?: Date;
  status: ScheduledStatus;
  runCount: number;
  maxRuns?: number;
  createdAt: Date;
  updatedAt: Date;
}

const scheduledTransferSchema = new Schema<IScheduledTransfer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fromAccountId: { type: Schema.Types.ObjectId, ref: 'BankAccount', required: true },
    toAccountId: { type: Schema.Types.ObjectId, ref: 'BankAccount' },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    toAccountNumber: { type: String },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'BNA' },
    frequency: { type: String, enum: ['once', 'daily', 'weekly', 'monthly'], required: true },
    reason: { type: String },
    nextRunAt: { type: Date, required: true },
    lastRunAt: { type: Date },
    status: { type: String, enum: ['active', 'paused', 'completed', 'cancelled'], default: 'active' },
    runCount: { type: Number, default: 0 },
    maxRuns: { type: Number },
  },
  { timestamps: true }
);

export const ScheduledTransfer = mongoose.model<IScheduledTransfer>(
  'ScheduledTransfer',
  scheduledTransferSchema
);
