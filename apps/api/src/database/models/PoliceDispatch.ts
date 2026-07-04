import mongoose, { Schema, Document, Types } from 'mongoose';

export type DispatchStatus = 'pending' | 'assigned' | 'en_route' | 'on_scene' | 'resolved' | 'cancelled';

export interface IPoliceDispatch extends Document {
  dispatchNumber: string;
  priority: 1 | 2 | 3;
  type: string;
  description: string;
  location: { address: string; lat?: number; lng?: number };
  assignedOfficerIds: Types.ObjectId[];
  assignedUnit?: string;
  status: DispatchStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const policeDispatchSchema = new Schema<IPoliceDispatch>(
  {
    dispatchNumber: { type: String, required: true, unique: true, index: true },
    priority: { type: Number, enum: [1, 2, 3], default: 2, index: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    location: {
      address: { type: String, required: true },
      lat: Number,
      lng: Number,
    },
    assignedOfficerIds: [{ type: Schema.Types.ObjectId, ref: 'PoliceOfficer' }],
    assignedUnit: { type: String },
    status: { type: String, enum: ['pending', 'assigned', 'en_route', 'on_scene', 'resolved', 'cancelled'], default: 'pending', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export const PoliceDispatch = mongoose.model<IPoliceDispatch>('PoliceDispatch', policeDispatchSchema);

export function generateDispatchNumber(): string {
  return `DSP-${Math.floor(100000 + Math.random() * 900000)}`;
}
