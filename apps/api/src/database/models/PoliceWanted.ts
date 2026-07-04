import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceWanted extends Document {
  wantedId: string;
  name: string;
  aliases: string[];
  photoUrl?: string;
  charges: string[];
  dangerLevel: 'low' | 'medium' | 'high' | 'extreme';
  lastSeen?: string;
  lastSeenDistrict?: string;
  status: 'active' | 'captured' | 'cleared';
  warrantId?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const policeWantedSchema = new Schema<IPoliceWanted>(
  {
    wantedId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    aliases: { type: [String], default: [] },
    photoUrl: { type: String },
    charges: { type: [String], default: [] },
    dangerLevel: { type: String, enum: ['low', 'medium', 'high', 'extreme'], default: 'medium' },
    lastSeen: { type: String },
    lastSeenDistrict: { type: String },
    status: { type: String, enum: ['active', 'captured', 'cleared'], default: 'active', index: true },
    warrantId: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceWanted = mongoose.model<IPoliceWanted>('PoliceWanted', policeWantedSchema);
