import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IJusticeCharge extends Document {
  chargeId: string;
  caseId: string;
  caseNumber: string;
  statute: string;
  title: string;
  description: string;
  severity: 'infraction' | 'misdemeanor' | 'felony';
  lawId?: string;
  filedByEmployeeId: string;
  status: 'filed' | 'amended' | 'dismissed' | 'convicted' | 'acquitted';
  filedAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceChargeSchema = new Schema<IJusticeCharge>(
  {
    chargeId: { type: String, required: true, unique: true, index: true },
    caseId: { type: String, required: true, index: true },
    caseNumber: { type: String, required: true, index: true },
    statute: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['infraction', 'misdemeanor', 'felony'], required: true },
    lawId: { type: String, index: true },
    filedByEmployeeId: { type: String, required: true },
    status: { type: String, enum: ['filed', 'amended', 'dismissed', 'convicted', 'acquitted'], default: 'filed', index: true },
    filedAt: { type: Date, default: Date.now },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeCharge = mongoose.model<IJusticeCharge>('JusticeCharge', justiceChargeSchema);
