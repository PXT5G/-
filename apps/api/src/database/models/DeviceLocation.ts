import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export type MovementState = 'stationary' | 'walking' | 'driving' | 'unknown';

export interface IDeviceLocation extends Document {
  userId: Types.ObjectId;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  altitude: number;
  accuracy: number;
  district: string;
  street: string;
  zone: string;
  region: string;
  gpsTimestamp: Date;
  movementState: MovementState;
  enabled: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const deviceLocationSchema = new Schema<IDeviceLocation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    latitude: { type: Number, default: 40.7128 },
    longitude: { type: Number, default: -74.006 },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    altitude: { type: Number, default: 10 },
    accuracy: { type: Number, default: 5 },
    district: { type: String, default: 'Manhattan' },
    street: { type: String, default: 'Broadway' },
    zone: { type: String, default: 'Financial District' },
    region: { type: String, default: 'New York' },
    gpsTimestamp: { type: Date, default: Date.now },
    movementState: {
      type: String,
      enum: ['stationary', 'walking', 'driving', 'unknown'],
      default: 'stationary',
    },
    enabled: { type: Boolean, default: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const DeviceLocation = mongoose.model<IDeviceLocation>('DeviceLocation', deviceLocationSchema);
