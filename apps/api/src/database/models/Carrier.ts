import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { ConnectionGeneration } from '../../constants/gtaMap';

export interface ICarrier extends Document {
  userId: Types.ObjectId;
  name: string;
  generation: ConnectionGeneration;
  connectedTowerUuid?: string;
  simIccid: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const carrierSchema = new Schema<ICarrier>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    name: { type: String, default: 'Banana Mobile' },
    generation: {
      type: String,
      enum: ['none', 'emergency', '2g', '3g', '4g', '5g'],
      default: '5g',
    },
    connectedTowerUuid: { type: String, index: true },
    simIccid: { type: String, default: '' },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Carrier = mongoose.model<ICarrier>('Carrier', carrierSchema);
