import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceOrganization extends Document {
  orgId: string;
  name: string;
  type: 'business' | 'nonprofit' | 'government' | 'criminal' | 'other';
  address?: string;
  district?: string;
  ownerName?: string;
  phone?: string;
  licenseNumber?: string;
  flags: string[];
  notes: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeOrgSchema = new Schema<IPoliceOrganization>(
  {
    orgId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    type: { type: String, enum: ['business', 'nonprofit', 'government', 'criminal', 'other'], default: 'business' },
    address: { type: String },
    district: { type: String, index: true },
    ownerName: { type: String },
    phone: { type: String, index: true },
    licenseNumber: { type: String, index: true },
    flags: { type: [String], default: [] },
    notes: { type: String, default: '' },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceOrganization = mongoose.model<IPoliceOrganization>('PoliceOrganization', policeOrgSchema);
