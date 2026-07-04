import mongoose, { Schema, Document, Types } from 'mongoose';
import type { PoliceRank } from './PolicePermission';

export interface IPoliceRankHistory extends Document {
  officerId: Types.ObjectId;
  userId: Types.ObjectId;
  previousRank: PoliceRank;
  newRank: PoliceRank;
  pointsChange: number;
  reason: string;
  performedBy: Types.ObjectId;
  createdAt: Date;
}

const policeRankHistorySchema = new Schema<IPoliceRankHistory>(
  {
    officerId: { type: Schema.Types.ObjectId, ref: 'PoliceOfficer', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    previousRank: { type: String, required: true },
    newRank: { type: String, required: true },
    pointsChange: { type: Number, default: 0 },
    reason: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const PoliceRankHistory = mongoose.model<IPoliceRankHistory>('PoliceRankHistory', policeRankHistorySchema);
