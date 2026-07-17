import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IEmsShift extends Document {
  shiftId: string;
  personnelId: Types.ObjectId;
  badgeNumber: string;
  shiftType: 'ambulance' | 'hospital' | 'dispatch' | 'helicopter' | 'admin';
  startAt: Date;
  endAt: Date;
  actualStartAt?: Date;
  actualEndAt?: Date;
  status: 'scheduled' | 'active' | 'completed' | 'missed';
  hospitalId?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const emsShiftSchema = new Schema<IEmsShift>(
  {
    shiftId: { type: String, required: true, unique: true, index: true },
    personnelId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    badgeNumber: { type: String, required: true, index: true },
    shiftType: { type: String, enum: ['ambulance', 'hospital', 'dispatch', 'helicopter', 'admin'], default: 'ambulance' },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    actualStartAt: { type: Date },
    actualEndAt: { type: Date },
    status: { type: String, enum: ['scheduled', 'active', 'completed', 'missed'], default: 'scheduled', index: true },
    hospitalId: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsShift = mongoose.model<IEmsShift>('EmsShift', emsShiftSchema);
