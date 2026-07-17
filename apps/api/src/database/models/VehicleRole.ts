import mongoose, { Schema, Document } from 'mongoose';
import type { VehicleRole as VehicleRoleType, VehiclePermission } from '../../constants/vehicles';

export interface IVehicleRole extends Document {
  role: VehicleRoleType;
  permissions: VehiclePermission[];
  updatedBy?: mongoose.Types.ObjectId;
}

const vehicleRoleSchema = new Schema<IVehicleRole>(
  {
    role: { type: String, required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const VehicleRoleModel = mongoose.model<IVehicleRole>('VehicleRole', vehicleRoleSchema);
