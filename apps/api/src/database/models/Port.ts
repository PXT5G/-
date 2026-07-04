import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPort extends Document {
  portId: string;
  code: string;
  name: string;
  type: 'commercial' | 'cargo' | 'passenger' | 'fishing' | 'military' | 'government';
  city: string;
  district: string;
  country: string;
  latitude: number;
  longitude: number;
  berthCount: number;
  maxVesselLength: number;
  maxDraft: number;
  hasFuelStation: boolean;
  hasShipyard: boolean;
  isGovernment: boolean;
  isMilitary: boolean;
  companyId?: string;
  status: 'active' | 'closed' | 'restricted';
  createdBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const portSchema = new Schema<IPort>(
  {
    portId: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    type: { type: String, enum: ['commercial', 'cargo', 'passenger', 'fishing', 'military', 'government'], default: 'commercial', index: true },
    city: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    country: { type: String, default: 'GULF' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    berthCount: { type: Number, default: 0 },
    maxVesselLength: { type: Number, default: 0 },
    maxDraft: { type: Number, default: 0 },
    hasFuelStation: { type: Boolean, default: false },
    hasShipyard: { type: Boolean, default: false },
    isGovernment: { type: Boolean, default: false },
    isMilitary: { type: Boolean, default: false },
    companyId: { type: String, index: true },
    status: { type: String, enum: ['active', 'closed', 'restricted'], default: 'active', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Port = mongoose.model<IPort>('Port', portSchema);
