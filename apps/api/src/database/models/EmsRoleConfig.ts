import mongoose, { Schema, Document } from 'mongoose';
import type { EmsRole, EmsPermission } from '../../constants/ems';

export interface IEmsRoleConfig extends Document {
  role: EmsRole;
  permissions: EmsPermission[];
  updatedBy?: mongoose.Types.ObjectId;
}

const emsRoleConfigSchema = new Schema<IEmsRoleConfig>(
  {
    role: { type: String, required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const EmsRoleConfig = mongoose.model<IEmsRoleConfig>('EmsRoleConfig', emsRoleConfigSchema);
