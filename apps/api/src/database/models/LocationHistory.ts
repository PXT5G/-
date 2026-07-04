import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ILocationHistory extends Document {
  userId: Types.ObjectId;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  altitude: number;
  district: string;
  street: string;
  zone: string;
  vehicleState: string;
  interior: boolean;
  recordedAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const locationHistorySchema = new Schema<ILocationHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    altitude: { type: Number, default: 0 },
    district: { type: String, default: '' },
    street: { type: String, default: '' },
    zone: { type: String, default: '' },
    vehicleState: { type: String, default: 'on_foot' },
    interior: { type: Boolean, default: false },
    recordedAt: { type: Date, default: Date.now, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

locationHistorySchema.index({ userId: 1, recordedAt: -1 });

export const LocationHistory = mongoose.model<ILocationHistory>('LocationHistory', locationHistorySchema);
