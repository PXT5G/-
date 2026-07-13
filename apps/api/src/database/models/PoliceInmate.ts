import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceInmate extends Document {
  inmateId: string;
  name: string;
  subjectUserId?: Types.ObjectId;
  charges: string[];
  jailDays: number;
  cellId?: string;
  bookedByBadge: string;
  bookedAt: Date;
  releaseAt: Date;
  releasedAt?: Date;
  status: 'in_custody' | 'released';
  notes?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeInmateSchema = new Schema<IPoliceInmate>(
  {
    inmateId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    subjectUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    charges: { type: [String], default: [] },
    jailDays: { type: Number, default: 1 },
    cellId: { type: String, index: true },
    bookedByBadge: { type: String, required: true },
    bookedAt: { type: Date, required: true },
    releaseAt: { type: Date, required: true },
    releasedAt: { type: Date },
    status: { type: String, enum: ['in_custody', 'released'], default: 'in_custody', index: true },
    notes: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceInmate = mongoose.model<IPoliceInmate>('PoliceInmate', policeInmateSchema);
