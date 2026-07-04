import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IJusticeLaw extends Document {
  lawId: string;
  statute: string;
  title: string;
  description: string;
  category: string;
  severity: 'infraction' | 'misdemeanor' | 'felony';
  minFine: number;
  maxFine: number;
  minJailDays: number;
  maxJailDays: number;
  effectiveDate: Date;
  amendedAt?: Date;
  active: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceLawSchema = new Schema<IJusticeLaw>(
  {
    lawId: { type: String, required: true, unique: true, index: true },
    statute: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    severity: { type: String, enum: ['infraction', 'misdemeanor', 'felony'], required: true },
    minFine: { type: Number, default: 0 },
    maxFine: { type: Number, default: 0 },
    minJailDays: { type: Number, default: 0 },
    maxJailDays: { type: Number, default: 0 },
    effectiveDate: { type: Date, default: Date.now },
    amendedAt: { type: Date },
    active: { type: Boolean, default: true, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeLaw = mongoose.model<IJusticeLaw>('JusticeLaw', justiceLawSchema);
