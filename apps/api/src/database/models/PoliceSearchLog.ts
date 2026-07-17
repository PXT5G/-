import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceSearchLog extends Document {
  searchId: string;
  searchType: string;
  query: string;
  officerId: Types.ObjectId;
  officerBadge: string;
  results: Record<string, unknown>;
  resultCount: number;
  ipAddress?: string;
  deviceUuid?: string;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeSearchLogSchema = new Schema<IPoliceSearchLog>(
  {
    searchId: { type: String, required: true, unique: true, index: true },
    searchType: { type: String, required: true, index: true },
    query: { type: String, required: true, index: true },
    officerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    officerBadge: { type: String, required: true },
    results: { type: Schema.Types.Mixed, default: {} },
    resultCount: { type: Number, default: 0 },
    ipAddress: { type: String },
    deviceUuid: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const PoliceSearchLog = mongoose.model<IPoliceSearchLog>('PoliceSearchLog', policeSearchLogSchema);
