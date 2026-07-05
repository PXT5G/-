import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ICompanyPermission extends Document {
  grantId: string;
  companyId: string;
  userId: Types.ObjectId;
  employeeId?: string;
  permission: string;
  grantedBy: Types.ObjectId;
  expiresAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const companyPermissionSchema = new Schema<ICompanyPermission>(
  {
    grantId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    employeeId: { type: String, index: true },
    permission: { type: String, required: true, index: true },
    grantedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

companyPermissionSchema.index({ companyId: 1, userId: 1, permission: 1 });

export const CompanyPermission = mongoose.model<ICompanyPermission>('CompanyPermission', companyPermissionSchema);
