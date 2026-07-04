import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { DispatchStatus } from '../../constants/police';

export interface IPoliceDispatch extends Document {
  dispatchId: string;
  callType: string;
  priority: number;
  status: DispatchStatus;
  title: string;
  description: string;
  callerName?: string;
  callerPhone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  street?: string;
  postalCode?: string;
  assignedUnitId?: string;
  assignedOfficerIds: Types.ObjectId[];
  assignedBadges: string[];
  is911: boolean;
  resolvedAt?: Date;
  notes: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeDispatchSchema = new Schema<IPoliceDispatch>(
  {
    dispatchId: { type: String, required: true, unique: true, index: true },
    callType: { type: String, required: true, index: true },
    priority: { type: Number, enum: [1, 2, 3], default: 2, index: true },
    status: { type: String, enum: ['pending', 'assigned', 'en_route', 'on_scene', 'resolved', 'cancelled'], default: 'pending', index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    callerName: { type: String },
    callerPhone: { type: String, index: true },
    address: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    district: { type: String, index: true },
    street: { type: String },
    postalCode: { type: String },
    assignedUnitId: { type: String, index: true },
    assignedOfficerIds: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    assignedBadges: { type: [String], default: [] },
    is911: { type: Boolean, default: false, index: true },
    resolvedAt: { type: Date },
    notes: { type: [String], default: [] },
    metadata: { type: Schema.Types.Mixed },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceDispatch = mongoose.model<IPoliceDispatch>('PoliceDispatch', policeDispatchSchema);
