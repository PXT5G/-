import mongoose, { Schema, Document, Types } from 'mongoose';

export type PaymentType = 'bill' | 'subscription' | 'store' | 'membership' | 'invoice' | 'request';
export type PaymentStatus = 'pending' | 'completed' | 'cancelled' | 'failed';

export interface IPayment extends Document {
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  amount: number;
  currency: string;
  type: PaymentType;
  recipient: string;
  description: string;
  status: PaymentStatus;
  reference: string;
  transactionId?: Types.ObjectId;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'BankAccount', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'BNA' },
    type: { type: String, enum: ['bill', 'subscription', 'store', 'membership', 'invoice', 'request'], required: true },
    recipient: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed', 'cancelled', 'failed'], default: 'pending' },
    reference: { type: String, required: true, unique: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
