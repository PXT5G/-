import mongoose, { Schema, Document } from 'mongoose';

export interface IIdempotencyRecord extends Document {
  key: string;
  method: string;
  path: string;
  statusCode: number;
  responseBody: Record<string, unknown>;
  expiresAt: Date;
  createdAt: Date;
}

const idempotencyRecordSchema = new Schema<IIdempotencyRecord>(
  {
    key: { type: String, required: true, unique: true, index: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    responseBody: { type: Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

idempotencyRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyRecord = mongoose.model<IIdempotencyRecord>(
  'IdempotencyRecord',
  idempotencyRecordSchema
);
