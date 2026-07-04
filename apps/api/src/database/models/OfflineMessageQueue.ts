import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IOfflineMessageQueue extends Document {
  userId: Types.ObjectId;
  clientMessageId: string;
  payload: Record<string, unknown>;
  state: 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';
  conflictResolution?: 'client_wins' | 'server_wins' | 'merged';
  retryCount: number;
  lastSyncAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const offlineMessageQueueSchema = new Schema<IOfflineMessageQueue>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientMessageId: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    state: { type: String, enum: ['pending', 'syncing', 'synced', 'conflict', 'failed'], default: 'pending', index: true },
    conflictResolution: { type: String, enum: ['client_wins', 'server_wins', 'merged'] },
    retryCount: { type: Number, default: 0 },
    lastSyncAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

offlineMessageQueueSchema.index({ userId: 1, clientMessageId: 1 }, { unique: true });

export const OfflineMessageQueue = mongoose.model<IOfflineMessageQueue>(
  'OfflineMessageQueue',
  offlineMessageQueueSchema
);
