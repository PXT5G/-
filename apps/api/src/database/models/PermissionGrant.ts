import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPermissionGrant extends Document {
  userId: Types.ObjectId;
  appId: string;
  permission: string;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  expiresAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const permissionGrantSchema = new Schema<IPermissionGrant>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appId: { type: String, required: true, index: true },
    permission: { type: String, required: true },
    granted: { type: Boolean, default: false },
    grantedAt: { type: Date },
    revokedAt: { type: Date },
    expiresAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

permissionGrantSchema.index({ userId: 1, appId: 1, permission: 1 }, { unique: true });

export const PermissionGrant = mongoose.model<IPermissionGrant>('PermissionGrant', permissionGrantSchema);
