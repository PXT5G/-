import mongoose, { Schema, Document, Types } from 'mongoose';
import type { PoliceRank } from './PolicePermission';

export type OfficerStatus = 'on_duty' | 'off_duty' | 'break' | 'en_route' | 'on_scene';

export interface IPoliceOfficer extends Document {
  userId: Types.ObjectId;
  badgeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  rank: PoliceRank;
  unit: string;
  points: number;
  status: OfficerStatus;
  location?: { lat: number; lng: number; updatedAt: Date };
  avatar?: string;
  isOnline: boolean;
  lastActiveAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const policeOfficerSchema = new Schema<IPoliceOfficer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    badgeNumber: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, index: true },
    rank: { type: String, enum: ['cadet', 'officer', 'sergeant', 'lieutenant', 'captain', 'chief'], default: 'officer' },
    unit: { type: String, default: 'Patrol' },
    points: { type: Number, default: 0, index: true },
    status: { type: String, enum: ['on_duty', 'off_duty', 'break', 'en_route', 'on_scene'], default: 'off_duty' },
    location: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
    },
    avatar: { type: String },
    isOnline: { type: Boolean, default: false, index: true },
    lastActiveAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

policeOfficerSchema.index({ rank: 1, points: -1 });

export const PoliceOfficer = mongoose.model<IPoliceOfficer>('PoliceOfficer', policeOfficerSchema);

export function generateBadgeNumber(): string {
  return `BNA-${Math.floor(1000 + Math.random() * 9000)}`;
}
