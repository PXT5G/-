import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceBolo extends Document {
  boloId: string;
  type: 'person' | 'vehicle' | 'property';
  title: string;
  description: string;
  subjectName?: string;
  plateNumber?: string;
  vehicleDescription?: string;
  photoUrl?: string;
  dangerLevel: 'low' | 'medium' | 'high' | 'extreme';
  status: 'active' | 'located' | 'expired' | 'cancelled';
  lastSeenLocation?: string;
  lastSeenDistrict?: string;
  latitude?: number;
  longitude?: number;
  issuedByOfficerId: Types.ObjectId;
  issuedByBadge: string;
  expiresAt?: Date;
  locatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeBoloSchema = new Schema<IPoliceBolo>(
  {
    boloId: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['person', 'vehicle', 'property'], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    subjectName: { type: String, index: true },
    plateNumber: { type: String, index: true },
    vehicleDescription: { type: String },
    photoUrl: { type: String },
    dangerLevel: { type: String, enum: ['low', 'medium', 'high', 'extreme'], default: 'medium', index: true },
    status: { type: String, enum: ['active', 'located', 'expired', 'cancelled'], default: 'active', index: true },
    lastSeenLocation: { type: String },
    lastSeenDistrict: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    issuedByOfficerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    issuedByBadge: { type: String, required: true },
    expiresAt: { type: Date },
    locatedAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceBolo = mongoose.model<IPoliceBolo>('PoliceBolo', policeBoloSchema);
