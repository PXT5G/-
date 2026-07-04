import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICorporateAction extends Document {
  actionId: string;
  companyId: string;
  stockId: string;
  ticker: string;
  type: string;
  title: string;
  description: string;
  effectiveDate: Date;
  ratio?: number;
  newShares?: number;
  status: 'announced' | 'executed' | 'cancelled';
  createdBy?: Types.ObjectId;
  metadata: Record<string, unknown>;
}

const corporateActionSchema = new Schema<ICorporateAction>(
  {
    actionId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    stockId: { type: String, required: true, index: true },
    ticker: { type: String, required: true },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    effectiveDate: { type: Date, required: true },
    ratio: { type: Number },
    newShares: { type: Number },
    status: { type: String, enum: ['announced', 'executed', 'cancelled'], default: 'announced', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const CorporateAction = mongoose.model<ICorporateAction>('CorporateAction', corporateActionSchema);
