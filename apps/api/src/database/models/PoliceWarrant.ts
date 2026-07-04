import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceWarrant extends Document {
  warrantId: string;
  type: 'arrest' | 'search' | 'bench';
  subjectName: string;
  subjectUserId?: Types.ObjectId;
  subjectPhone?: string;
  charges: string[];
  description: string;
  issuedBy: string;
  judgeName?: string;
  status: 'active' | 'served' | 'expired' | 'revoked';
  address?: string;
  district?: string;
  expiresAt: Date;
  servedAt?: Date;
  servedByOfficerId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeWarrantSchema = new Schema<IPoliceWarrant>(
  {
    warrantId: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['arrest', 'search', 'bench'], required: true },
    subjectName: { type: String, required: true, index: true },
    subjectUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    subjectPhone: { type: String, index: true },
    charges: { type: [String], default: [] },
    description: { type: String, required: true },
    issuedBy: { type: String, required: true },
    judgeName: { type: String },
    status: { type: String, enum: ['active', 'served', 'expired', 'revoked'], default: 'active', index: true },
    address: { type: String },
    district: { type: String },
    expiresAt: { type: Date, required: true, index: true },
    servedAt: { type: Date },
    servedByOfficerId: { type: Schema.Types.ObjectId, ref: 'User' },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceWarrant = mongoose.model<IPoliceWarrant>('PoliceWarrant', policeWarrantSchema);
