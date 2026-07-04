import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IWorldLocation extends Document {
  locationId: string;
  name: string;
  street: string;
  district: string;
  zone: string;
  category: string;
  latitude: number;
  longitude: number;
  boundingRadiusM: number;
  nearbyLocationIds: string[];
  roadConnections: string[];
  postalCode: string;
  landmark: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const worldLocationSchema = new Schema<IWorldLocation>(
  {
    locationId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    street: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    zone: { type: String, required: true },
    category: { type: String, required: true, index: true },
    latitude: { type: Number, required: true, index: true },
    longitude: { type: Number, required: true, index: true },
    boundingRadiusM: { type: Number, default: 50 },
    nearbyLocationIds: [{ type: String }],
    roadConnections: [{ type: String }],
    postalCode: { type: String, default: '' },
    landmark: { type: Boolean, default: false, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

worldLocationSchema.index({ latitude: 1, longitude: 1 });
worldLocationSchema.index({ district: 1, category: 1 });

export const WorldLocation = mongoose.model<IWorldLocation>('WorldLocation', worldLocationSchema);
