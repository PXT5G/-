import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { PoliceRole, PolicePermission } from '../../constants/police';

export interface IPoliceRoleConfig extends Document {
  role: PoliceRole;
  permissions: PolicePermission[];
  updatedBy?: mongoose.Types.ObjectId;
}

const policeRoleConfigSchema = new Schema<IPoliceRoleConfig>(
  {
    role: { type: String, required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const PoliceRoleConfig = mongoose.model<IPoliceRoleConfig>('PoliceRoleConfig', policeRoleConfigSchema);
