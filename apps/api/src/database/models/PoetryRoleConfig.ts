import mongoose, { Schema, Document, Types } from 'mongoose';
import type { PoetryRole, PoetryPermission } from '../../constants/poetry';

export interface IPoetryRoleConfig extends Document {
  role: PoetryRole;
  permissions: PoetryPermission[];
  updatedBy?: Types.ObjectId;
}

const poetryRoleConfigSchema = new Schema<IPoetryRoleConfig>(
  {
    role: { type: String, required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const PoetryRoleConfig = mongoose.model<IPoetryRoleConfig>('PoetryRoleConfig', poetryRoleConfigSchema);
