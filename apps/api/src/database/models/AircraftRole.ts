import mongoose, { Schema, Document } from 'mongoose';
import type { AviationRole as AviationRoleType, AviationPermission } from '../../constants/aviation';

export interface IAircraftRole extends Document {
  role: AviationRoleType;
  permissions: AviationPermission[];
  updatedBy?: mongoose.Types.ObjectId;
}

const aircraftRoleSchema = new Schema<IAircraftRole>(
  {
    role: { type: String, required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const AircraftRoleModel = mongoose.model<IAircraftRole>('AircraftRole', aircraftRoleSchema);
