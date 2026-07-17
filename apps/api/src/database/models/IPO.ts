import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { IpoStatus } from '../../constants/exchange';

export interface IIPO extends Document {
  ipoId: string;
  companyId: string;
  listedCompanyId?: string;
  applicantUserId: Types.ObjectId;
  ticker: string;
  proposedName: string;
  sector: string;
  companyType: string;
  status: IpoStatus;
  sharesOffered: number;
  openingPrice: number;
  listingDate?: Date;
  lockupDays: number;
  lockupEndsAt?: Date;
  governmentReviewNotes?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  approvedAt?: Date;
  shareAllocation: { userId?: Types.ObjectId; shares: number; price: number }[];
  history: { status: string; note: string; at: Date; actorId?: Types.ObjectId }[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const ipoSchema = new Schema<IIPO>(
  {
    ipoId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    listedCompanyId: { type: String, index: true },
    applicantUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ticker: { type: String, required: true, index: true },
    proposedName: { type: String, required: true },
    sector: { type: String, required: true },
    companyType: { type: String, required: true },
    status: { type: String, enum: ['applied', 'under_review', 'approved', 'rejected', 'scheduled', 'listed', 'withdrawn'], default: 'applied', index: true },
    sharesOffered: { type: Number, default: 1_000_000 },
    openingPrice: { type: Number, default: 0 },
    listingDate: { type: Date },
    lockupDays: { type: Number, default: 90 },
    lockupEndsAt: { type: Date },
    governmentReviewNotes: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    approvedAt: { type: Date },
    shareAllocation: { type: [{ userId: Schema.Types.ObjectId, shares: Number, price: Number }], default: [] },
    history: { type: [{ status: String, note: String, at: Date, actorId: Schema.Types.ObjectId }], default: [] },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const IPO = mongoose.model<IIPO>('IPO', ipoSchema);
