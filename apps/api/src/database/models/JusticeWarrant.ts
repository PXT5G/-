import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { WarrantReviewStatus } from '../../constants/justice';

export interface IJusticeWarrant extends Document {
  warrantReviewId: string;
  policeWarrantId: string;
  warrantType: 'arrest' | 'search' | 'bench';
  subjectName: string;
  subjectUserId?: Types.ObjectId;
  charges: string[];
  description: string;
  requestedByBadge: string;
  requestedByOfficerId?: Types.ObjectId;
  reviewStatus: WarrantReviewStatus;
  reviewedByEmployeeId?: string;
  judgeEmployeeId?: string;
  judgeName?: string;
  signatureHash?: string;
  denialReason?: string;
  reviewedAt?: Date;
  expiresAt: Date;
  address?: string;
  district?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceWarrantSchema = new Schema<IJusticeWarrant>(
  {
    warrantReviewId: { type: String, required: true, unique: true, index: true },
    policeWarrantId: { type: String, required: true, unique: true, index: true },
    warrantType: { type: String, enum: ['arrest', 'search', 'bench'], required: true },
    subjectName: { type: String, required: true, index: true },
    subjectUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    charges: { type: [String], default: [] },
    description: { type: String, required: true },
    requestedByBadge: { type: String, required: true },
    requestedByOfficerId: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewStatus: { type: String, enum: ['pending', 'approved', 'denied', 'expired'], default: 'pending', index: true },
    reviewedByEmployeeId: { type: String, index: true },
    judgeEmployeeId: { type: String },
    judgeName: { type: String },
    signatureHash: { type: String },
    denialReason: { type: String },
    reviewedAt: { type: Date },
    expiresAt: { type: Date, required: true },
    address: { type: String },
    district: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeWarrant = mongoose.model<IJusticeWarrant>('JusticeWarrant', justiceWarrantSchema);
