import mongoose, { Schema, Document, Types } from 'mongoose';
import type { FocusProfileType } from '../../constants/focus';
import { auditSchemaFields } from '../baseSchema';

export interface IFocusProfile extends Document {
  profileId: string;
  userId: Types.ObjectId;
  name: string;
  type: FocusProfileType;
  icon?: string;
  color?: string;
  isActive: boolean;
  allowedApps: string[];
  blockedApps: string[];
  allowedContacts: string[];
  blockedContacts: string[];
  notificationFilters: Record<string, unknown>;
  wallpaperId?: string;
  lockScreenProfile?: string;
  homeScreenProfile?: string;
  schedules: { scheduleId: string; startTime: string; endTime: string; days: number[] }[];
  locationRules: { latitude: number; longitude: number; radiusM: number; name: string }[];
  automationIds: string[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const focusProfileSchema = new Schema<IFocusProfile>(
  {
    profileId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true, index: true },
    icon: String,
    color: String,
    isActive: { type: Boolean, default: false, index: true },
    allowedApps: { type: [String], default: [] },
    blockedApps: { type: [String], default: [] },
    allowedContacts: { type: [String], default: [] },
    blockedContacts: { type: [String], default: [] },
    notificationFilters: { type: Schema.Types.Mixed, default: {} },
    wallpaperId: String,
    lockScreenProfile: String,
    homeScreenProfile: String,
    schedules: [{
      scheduleId: String,
      startTime: String,
      endTime: String,
      days: [Number],
    }],
    locationRules: [{
      latitude: Number,
      longitude: Number,
      radiusM: Number,
      name: String,
    }],
    automationIds: { type: [String], default: [] },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

focusProfileSchema.index({ userId: 1, isActive: 1 });

export const FocusProfile = mongoose.model<IFocusProfile>('FocusProfile', focusProfileSchema);
