import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IJusticeCourtroom extends Document {
  courtroomId: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  judgeEmployeeId?: string;
  status: 'available' | 'in_session' | 'maintenance';
  liveSessionId?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceCourtroomSchema = new Schema<IJusticeCourtroom>(
  {
    courtroomId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    building: { type: String, default: 'GULF Superior Courthouse' },
    floor: { type: Number, default: 1 },
    capacity: { type: Number, default: 50 },
    judgeEmployeeId: { type: String, index: true },
    status: { type: String, enum: ['available', 'in_session', 'maintenance'], default: 'available', index: true },
    liveSessionId: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeCourtroom = mongoose.model<IJusticeCourtroom>('JusticeCourtroom', justiceCourtroomSchema);
