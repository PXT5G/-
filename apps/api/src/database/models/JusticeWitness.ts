import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IJusticeWitness extends Document {
  witnessId: string;
  caseId: string;
  caseNumber: string;
  name: string;
  userId?: Types.ObjectId;
  phone?: string;
  role: 'eyewitness' | 'expert' | 'character' | 'police' | 'victim';
  testimony?: string;
  subpoenaId?: string;
  status: 'listed' | 'subpoenaed' | 'testified' | 'unavailable';
  addedByEmployeeId: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceWitnessSchema = new Schema<IJusticeWitness>(
  {
    witnessId: { type: String, required: true, unique: true, index: true },
    caseId: { type: String, required: true, index: true },
    caseNumber: { type: String, required: true, index: true },
    name: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    phone: { type: String },
    role: { type: String, enum: ['eyewitness', 'expert', 'character', 'police', 'victim'], default: 'eyewitness' },
    testimony: { type: String },
    subpoenaId: { type: String },
    status: { type: String, enum: ['listed', 'subpoenaed', 'testified', 'unavailable'], default: 'listed', index: true },
    addedByEmployeeId: { type: String, required: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeWitness = mongoose.model<IJusticeWitness>('JusticeWitness', justiceWitnessSchema);
