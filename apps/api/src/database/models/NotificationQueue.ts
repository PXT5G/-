import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { NotificationPriority } from '@gulfos/shared';

export type NotificationDeliveryState = 'pending' | 'delivered' | 'failed' | 'dismissed';

export interface INotificationQueue extends Document {
  userId: Types.ObjectId;
  appId: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  priority: NotificationPriority;
  silent: boolean;
  headsUp: boolean;
  lockScreen: boolean;
  dynamicIsland: boolean;
  groupId?: string;
  actions?: { id: string; label: string; destructive?: boolean }[];
  deepLink?: string;
  deliveryState: NotificationDeliveryState;
  read: boolean;
  dismissed: boolean;
  scheduledAt?: Date;
  deliveredAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationQueueSchema = new Schema<INotificationQueue>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appId: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    icon: { type: String },
    image: { type: String },
    priority: { type: String, enum: ['low', 'normal', 'high', 'critical'], default: 'normal' },
    silent: { type: Boolean, default: false },
    headsUp: { type: Boolean, default: true },
    lockScreen: { type: Boolean, default: true },
    dynamicIsland: { type: Boolean, default: false },
    groupId: { type: String },
    actions: [{ id: String, label: String, destructive: Boolean }],
    deepLink: { type: String },
    deliveryState: {
      type: String,
      enum: ['pending', 'delivered', 'failed', 'dismissed'],
      default: 'pending',
      index: true,
    },
    read: { type: Boolean, default: false },
    dismissed: { type: Boolean, default: false },
    scheduledAt: { type: Date },
    deliveredAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

notificationQueueSchema.index({ userId: 1, deliveryState: 1, createdAt: -1 });

export const NotificationQueue = mongoose.model<INotificationQueue>(
  'NotificationQueue',
  notificationQueueSchema
);
