import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IStreet extends Document {
  streetId: string;
  name: string;
  district: string;
  zone: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  postalCode: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const streetSchema = new Schema<IStreet>(
  {
    streetId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    zone: { type: String, default: '' },
    startLat: { type: Number, required: true },
    startLng: { type: Number, required: true },
    endLat: { type: Number, required: true },
    endLng: { type: Number, required: true },
    postalCode: { type: String, default: '' },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Street = mongoose.model<IStreet>('Street', streetSchema);
