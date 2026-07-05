import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { MarinaType } from '../../constants/marine';

export interface IMarina extends Document {
  marinaId: string;
  code: string;
  name: string;
  type: MarinaType;
  city: string;
  district: string;
  country: string;
  latitude: number;
  longitude: number;
  berthCount: number;
  dockCount: number;
  hasFuelStation: boolean;
  hasMaintenance: boolean;
  hasBoatStorage: boolean;
  isGovernment: boolean;
  isMilitary: boolean;
  companyId?: string;
  ownerUserId?: mongoose.Types.ObjectId;
  status: 'active' | 'closed' | 'restricted';
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const marinaSchema = new Schema<IMarina>(
  {
    marinaId: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    type: { type: String, enum: ['marina', 'private_dock', 'public_dock', 'port', 'harbor', 'shipyard', 'boat_storage'], default: 'marina', index: true },
    city: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    country: { type: String, default: 'GULF' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    berthCount: { type: Number, default: 0 },
    dockCount: { type: Number, default: 0 },
    hasFuelStation: { type: Boolean, default: false },
    hasMaintenance: { type: Boolean, default: false },
    hasBoatStorage: { type: Boolean, default: false },
    isGovernment: { type: Boolean, default: false, index: true },
    isMilitary: { type: Boolean, default: false, index: true },
    companyId: { type: String, index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'closed', 'restricted'], default: 'active', index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Marina = mongoose.model<IMarina>('Marina', marinaSchema);
