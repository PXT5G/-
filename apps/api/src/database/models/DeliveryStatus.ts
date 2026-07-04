import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { DeliveryState } from '../../constants/communication';

export interface IDeliveryStatus extends Document {
  messageId: string;
  conversationId: string;
  recipientId: Types.ObjectId;
  state: DeliveryState;
  attempts: number;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failureReason?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const deliveryStatusSchema = new Schema<IDeliveryStatus>(
  {
    messageId: { type: String, required: true, index: true },
    conversationId: { type: String, required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    state: {
      type: String,
      enum: ['queued', 'uploading', 'encrypting', 'sending', 'sent', 'delivered', 'read', 'failed', 'retry', 'cancelled'],
      default: 'queued',
      index: true,
    },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    failureReason: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

deliveryStatusSchema.index({ messageId: 1, recipientId: 1 }, { unique: true });
deliveryStatusSchema.index({ recipientId: 1, state: 1 });

export const DeliveryStatus = mongoose.model<IDeliveryStatus>('DeliveryStatus', deliveryStatusSchema);
