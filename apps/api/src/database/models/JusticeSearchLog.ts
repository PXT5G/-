import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IJusticeSearchLog extends Document {
  searchId: string;
  searchType: string;
  query: string;
  officialId: Types.ObjectId;
  employeeId: string;
  results: Record<string, unknown>;
  resultCount: number;
  ipAddress?: string;
  deviceUuid?: string;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceSearchLogSchema = new Schema<IJusticeSearchLog>(
  {
    searchId: { type: String, required: true, unique: true, index: true },
    searchType: { type: String, required: true, index: true },
    query: { type: String, required: true },
    officialId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    employeeId: { type: String, required: true },
    results: { type: Schema.Types.Mixed, default: {} },
    resultCount: { type: Number, default: 0 },
    ipAddress: { type: String },
    deviceUuid: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeSearchLog = mongoose.model<IJusticeSearchLog>('JusticeSearchLog', justiceSearchLogSchema);
