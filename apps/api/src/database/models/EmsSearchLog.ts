import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IEmsSearchLog extends Document {
  searchId: string;
  searchType: string;
  query: string;
  personnelId: Types.ObjectId;
  badgeNumber: string;
  results: Record<string, unknown>;
  resultCount: number;
  ipAddress?: string;
  deviceUuid?: string;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const emsSearchLogSchema = new Schema<IEmsSearchLog>(
  {
    searchId: { type: String, required: true, unique: true, index: true },
    searchType: { type: String, required: true, index: true },
    query: { type: String, required: true },
    personnelId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    badgeNumber: { type: String, required: true },
    results: { type: Schema.Types.Mixed, default: {} },
    resultCount: { type: Number, default: 0 },
    ipAddress: { type: String },
    deviceUuid: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsSearchLog = mongoose.model<IEmsSearchLog>('EmsSearchLog', emsSearchLogSchema);
