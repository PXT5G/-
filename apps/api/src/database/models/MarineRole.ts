import mongoose, { Schema, Document } from 'mongoose';
import type { MarineRole as MarineRoleType, MarinePermission } from '../../constants/marine';

export interface IMarineRole extends Document {
  role: MarineRoleType;
  permissions: MarinePermission[];
  updatedBy?: mongoose.Types.ObjectId;
}

const marineRoleSchema = new Schema<IMarineRole>(
  {
    role: { type: String, required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const MarineRoleModel = mongoose.model<IMarineRole>('MarineRole', marineRoleSchema);
