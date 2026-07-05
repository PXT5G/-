import mongoose, { Schema, Document, Types } from 'mongoose';
import type { LiveActivityType, LiveActivityState } from '../../constants/phoneOs';
import { auditSchemaFields } from '../baseSchema';

export interface ILiveActivity extends Document {
  userId: Types.ObjectId;
  activityId: string;
  type: LiveActivityType;
  state: LiveActivityState;
  title: string;
  subtitle?: string;
  icon?: string;
  progress?: number;
  appId: string;
  payload: Record<string, unknown>;
  startedAt: Date;
  endedAt?: Date;
  expiresAt?: Date;
  dynamicIsland: boolean;
  lockScreen: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const liveActivitySchema = new Schema<ILiveActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    activityId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        'incoming_call',
        'navigation',
        'music',
        'download',
        'upload',
        'timer',
        'stopwatch',
        'ems_dispatch',
        'police_dispatch',
        'flight',
        'vehicle_delivery',
        'property_sale',
        'stock_alert',
        'custom',
      ],
      required: true,
    },
    state: { type: String, enum: ['active', 'paused', 'ended', 'dismissed'], default: 'active' },
    title: { type: String, required: true },
    subtitle: { type: String },
    icon: { type: String },
    progress: { type: Number },
    appId: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    expiresAt: { type: Date },
    dynamicIsland: { type: Boolean, default: true },
    lockScreen: { type: Boolean, default: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

liveActivitySchema.index({ userId: 1, activityId: 1 }, { unique: true });
liveActivitySchema.index({ userId: 1, state: 1 });

export const LiveActivity = mongoose.model<ILiveActivity>('LiveActivity', liveActivitySchema);
