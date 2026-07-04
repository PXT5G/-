import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IDistrict extends Document {
  districtId: string;
  name: string;
  zone: string;
  postalPrefix: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  terrain: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const districtSchema = new Schema<IDistrict>(
  {
    districtId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    zone: { type: String, required: true },
    postalPrefix: { type: String, default: '' },
    minLat: { type: Number, required: true },
    maxLat: { type: Number, required: true },
    minLng: { type: Number, required: true },
    maxLng: { type: Number, required: true },
    terrain: { type: String, default: 'urban' },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const District = mongoose.model<IDistrict>('District', districtSchema);
