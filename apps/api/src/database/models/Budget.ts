import mongoose, { Schema, Document, Types } from 'mongoose';

export type BudgetPeriod = 'monthly' | 'yearly';

export interface IBudget extends Document {
  userId: Types.ObjectId;
  category: string;
  limit: number;
  spent: number;
  period: BudgetPeriod;
  currency: string;
  alertThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true },
    limit: { type: Number, required: true, min: 0 },
    spent: { type: Number, default: 0, min: 0 },
    period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    currency: { type: String, default: 'BNA' },
    alertThreshold: { type: Number, default: 0.8 },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, category: 1, period: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>('Budget', budgetSchema);
