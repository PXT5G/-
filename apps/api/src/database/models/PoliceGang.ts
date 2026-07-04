import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceGang extends Document {
  gangId: string;
  name: string;
  aliases: string[];
  territory: string[];
  members: string[];
  dangerLevel: 'low' | 'medium' | 'high' | 'extreme';
  notes: string;
  activeCases: string[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeGangSchema = new Schema<IPoliceGang>(
  {
    gangId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    aliases: { type: [String], default: [] },
    territory: { type: [String], default: [] },
    members: { type: [String], default: [] },
    dangerLevel: { type: String, enum: ['low', 'medium', 'high', 'extreme'], default: 'medium' },
    notes: { type: String, default: '' },
    activeCases: { type: [String], default: [] },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceGang = mongoose.model<IPoliceGang>('PoliceGang', policeGangSchema);
