import mongoose, { Schema, Document } from 'mongoose';
import type { ExchangeRole, ExchangePermission } from '../../constants/exchange';

export interface IExchangeRole extends Document {
  roleId: string;
  role: ExchangeRole | string;
  permissions: ExchangePermission[];
  description: string;
  isSystem: boolean;
}

const exchangeRoleSchema = new Schema<IExchangeRole>(
  {
    roleId: { type: String, required: true, unique: true, index: true },
    role: { type: String, required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
    description: { type: String, default: '' },
    isSystem: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ExchangeRoleModel = mongoose.model<IExchangeRole>('ExchangeRole', exchangeRoleSchema);
