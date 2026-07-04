import mongoose, { Schema, Document, Types } from 'mongoose';
import type { BrowserRole, BrowserPermission } from '../../constants/browser';

export interface IBrowserRoleConfig extends Document {
  role: BrowserRole;
  permissions: BrowserPermission[];
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const browserRoleConfigSchema = new Schema<IBrowserRoleConfig>(
  {
    role: { type: String, required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const BrowserRoleConfig = mongoose.model<IBrowserRoleConfig>('BrowserRoleConfig', browserRoleConfigSchema);
