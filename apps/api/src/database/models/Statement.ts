import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStatement extends Document {
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  openingBalance: number;
  closingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
  currency: string;
  generatedAt: Date;
  createdAt: Date;
}

const statementSchema = new Schema<IStatement>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'BankAccount', required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    openingBalance: { type: Number, required: true },
    closingBalance: { type: Number, required: true },
    totalIncome: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    currency: { type: String, default: 'BNA' },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Statement = mongoose.model<IStatement>('Statement', statementSchema);
