import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface INotificationHistoryEntry extends Document {
  userId: Types.ObjectId;
  notificationId: string;
  appId: string;
  title: string;
  body: string;
  icon?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  groupId?: string;
  category?: string;
  pinned: boolean;
  silent: boolean;
  scheduledAt?: Date;
  deliveredAt: Date;
  readAt?: Date;
  dismissedAt?: Date;
  actions?: { id: string; label: string }[];
  metadata?: Record<string, unknown>;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const notificationHistorySchema = new Schema<INotificationHistoryEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    notificationId: { type: String, required: true, index: true },
    appId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    icon: { type: String },
    priority: { type: String, enum: ['low', 'normal', 'high', 'critical'], default: 'normal' },
    groupId: { type: String, index: true },
    category: { type: String },
    pinned: { type: Boolean, default: false },
    silent: { type: Boolean, default: false },
    scheduledAt: { type: Date },
    deliveredAt: { type: Date, default: Date.now, index: true },
    readAt: { type: Date },
    dismissedAt: { type: Date },
    actions: [{ id: String, label: String }],
    metadata: { type: Schema.Types.Mixed },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

notificationHistorySchema.index({ userId: 1, deliveredAt: -1 });
notificationHistorySchema.index({ userId: 1, notificationId: 1 }, { unique: true });

export const NotificationHistoryEntry = mongoose.model<INotificationHistoryEntry>(
  'NotificationHistoryEntry',
  notificationHistorySchema
);
