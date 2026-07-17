import mongoose, { Schema, Document } from 'mongoose';
import type { EconomyRole, EconomyPermission } from '../../constants/economy';

export interface IEconomyRole extends Document {
  roleId: string;
  role: EconomyRole | string;
  permissions: EconomyPermission[];
  description: string;
  isSystem: boolean;
}

const economyRoleSchema = new Schema<IEconomyRole>(
  {
    roleId: { type: String, required: true, unique: true, index: true },
    role: { type: String, required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
    description: { type: String, default: '' },
    isSystem: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const EconomyRoleModel = mongoose.model<IEconomyRole>('EconomyRole', economyRoleSchema);
