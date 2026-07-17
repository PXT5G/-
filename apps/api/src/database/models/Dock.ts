import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IDock extends Document {
  dockId: string;
  marinaId: string;
  name: string;
  type: 'private' | 'public' | 'commercial' | 'government' | 'military';
  capacity: number;
  occupiedSlots: number;
  length: number;
  depth: number;
  companyId?: string;
  ownerUserId?: mongoose.Types.ObjectId;
  monthlyRate: number;
  hasPower: boolean;
  hasWater: boolean;
  status: 'available' | 'full' | 'maintenance' | 'closed';
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const dockSchema = new Schema<IDock>(
  {
    dockId: { type: String, required: true, unique: true, index: true },
    marinaId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['private', 'public', 'commercial', 'government', 'military'], default: 'commercial', index: true },
    capacity: { type: Number, required: true, min: 1 },
    occupiedSlots: { type: Number, default: 0 },
    length: { type: Number, default: 0 },
    depth: { type: Number, default: 0 },
    companyId: { type: String, index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    monthlyRate: { type: Number, default: 0 },
    hasPower: { type: Boolean, default: true },
    hasWater: { type: Boolean, default: true },
    status: { type: String, enum: ['available', 'full', 'maintenance', 'closed'], default: 'available', index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Dock = mongoose.model<IDock>('Dock', dockSchema);
