import mongoose, { Schema, Document } from 'mongoose';
import type { BusinessRole, BusinessPermission } from '../../constants/business';

export interface ICompanyRole extends Document {
  role: BusinessRole;
  permissions: BusinessPermission[];
  updatedBy?: mongoose.Types.ObjectId;
}

const companyRoleSchema = new Schema<ICompanyRole>(
  {
    role: { type: String, required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const CompanyRole = mongoose.model<ICompanyRole>('CompanyRole', companyRoleSchema);
