import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceCitation extends Document {
  citationId: string;
  citationType: 'citation' | 'warning';
  violatorName: string;
  violatorUserId?: Types.ObjectId;
  plateNumber?: string;
  violationCode: string;
  description: string;
  fineAmount: number;
  jailDays: number;
  location: string;
  district?: string;
  officerId: Types.ObjectId;
  officerBadge: string;
  status: 'issued' | 'paid' | 'contested' | 'voided';
  paidAt?: Date;
  bankTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeCitationSchema = new Schema<IPoliceCitation>(
  {
    citationId: { type: String, required: true, unique: true, index: true },
    citationType: { type: String, enum: ['citation', 'warning'], default: 'citation' },
    violatorName: { type: String, required: true, index: true },
    violatorUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    plateNumber: { type: String, index: true },
    violationCode: { type: String, required: true },
    description: { type: String, required: true },
    fineAmount: { type: Number, default: 0 },
    jailDays: { type: Number, default: 0 },
    location: { type: String, required: true },
    district: { type: String },
    officerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    officerBadge: { type: String, required: true },
    status: { type: String, enum: ['issued', 'paid', 'contested', 'voided'], default: 'issued', index: true },
    paidAt: { type: Date },
    bankTransactionId: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceCitation = mongoose.model<IPoliceCitation>('PoliceCitation', policeCitationSchema);
