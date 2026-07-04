import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export type TrackingStatus = 'pending' | 'active' | 'completed' | 'denied' | 'expired';

export interface ITrackingRequest extends Document {
  requesterId: Types.ObjectId;
  targetUserId?: Types.ObjectId;
  targetPhoneNumber?: string;
  requestType: string;
  status: TrackingStatus;
  reason: string;
  warrantId?: string;
  expiresAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const trackingRequestSchema = new Schema<ITrackingRequest>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    targetPhoneNumber: { type: String, index: true },
    requestType: {
      type: String,
      enum: [
        'phone_number', 'current_tower', 'last_tower', 'last_location',
        'movement_history', 'signal_history', 'network_state', 'online_status',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'denied', 'expired'],
      default: 'pending',
    },
    reason: { type: String, required: true },
    warrantId: { type: String },
    expiresAt: { type: Date, required: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const TrackingRequest = mongoose.model<ITrackingRequest>('TrackingRequest', trackingRequestSchema);
