import mongoose, { Schema, Document } from 'mongoose';
import type { JusticeRole, JusticePermission } from '../../constants/justice';

export interface IJusticeRoleConfig extends Document {
  role: JusticeRole;
  permissions: JusticePermission[];
  updatedBy?: mongoose.Types.ObjectId;
}

const justiceRoleConfigSchema = new Schema<IJusticeRoleConfig>(
  {
    role: { type: String, required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const JusticeRoleConfig = mongoose.model<IJusticeRoleConfig>('JusticeRoleConfig', justiceRoleConfigSchema);
