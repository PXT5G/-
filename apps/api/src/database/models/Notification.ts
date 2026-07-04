import mongoose, { Schema, Document } from 'mongoose';
import type { NotificationPriority } from '@bananaos/shared';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  appId: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  priority: NotificationPriority;
  read: boolean;
  groupId?: string;
  actions?: { id: string; label: string; destructive?: boolean }[];
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appId: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    icon: { type: String },
    image: { type: String },
    priority: { type: String, enum: ['low', 'normal', 'high', 'critical'], default: 'normal' },
    read: { type: Boolean, default: false },
    groupId: { type: String },
    actions: [
      {
        id: String,
        label: String,
        destructive: Boolean,
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
