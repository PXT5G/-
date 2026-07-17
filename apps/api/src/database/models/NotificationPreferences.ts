import mongoose, { Schema, Document, Types } from 'mongoose';
import type { NotificationGroupMode } from '../../constants/phoneOs';
import { auditSchemaFields } from '../baseSchema';

export interface INotificationPreferences extends Document {
  userId: Types.ObjectId;
  groupMode: NotificationGroupMode;
  showPreviews: boolean;
  showOnLockScreen: boolean;
  showInHistory: boolean;
  showSummaries: boolean;
  allowCritical: boolean;
  allowSilent: boolean;
  allowScheduled: boolean;
  allowPersistent: boolean;
  allowInlineReplies: boolean;
  allowActionButtons: boolean;
  perAppSettings: Record<string, { enabled: boolean; silent: boolean; priority: string }>;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationPreferencesSchema = new Schema<INotificationPreferences>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    groupMode: { type: String, enum: ['automatic', 'by_app', 'off'], default: 'automatic' },
    showPreviews: { type: Boolean, default: true },
    showOnLockScreen: { type: Boolean, default: true },
    showInHistory: { type: Boolean, default: true },
    showSummaries: { type: Boolean, default: true },
    allowCritical: { type: Boolean, default: true },
    allowSilent: { type: Boolean, default: true },
    allowScheduled: { type: Boolean, default: true },
    allowPersistent: { type: Boolean, default: true },
    allowInlineReplies: { type: Boolean, default: true },
    allowActionButtons: { type: Boolean, default: true },
    perAppSettings: { type: Schema.Types.Mixed, default: {} },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const NotificationPreferences = mongoose.model<INotificationPreferences>(
  'NotificationPreferences',
  notificationPreferencesSchema
);
