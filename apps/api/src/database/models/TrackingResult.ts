import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ITrackingResult extends Document {
  requestId: Types.ObjectId;
  requesterId: Types.ObjectId;
  targetUserId?: Types.ObjectId;
  resultType: string;
  payload: Record<string, unknown>;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const trackingResultSchema = new Schema<ITrackingResult>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'TrackingRequest', required: true, index: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    resultType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const TrackingResult = mongoose.model<ITrackingResult>('TrackingResult', trackingResultSchema);
