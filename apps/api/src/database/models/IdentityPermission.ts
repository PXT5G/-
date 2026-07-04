import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IIdentityPermission extends Document {
  identityId: Types.ObjectId;
  userId: Types.ObjectId;
  appId: string;
  permission: string;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  expiresAt?: Date;
}

const identityPermissionSchema = new Schema<IIdentityPermission>(
  {
    identityId: { type: Schema.Types.ObjectId, ref: 'Identity', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appId: { type: String, required: true },
    permission: { type: String, required: true },
    granted: { type: Boolean, default: true },
    grantedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

identityPermissionSchema.index({ userId: 1, appId: 1, permission: 1 }, { unique: true });

export const IdentityPermission = mongoose.model<IIdentityPermission>(
  'IdentityPermission',
  identityPermissionSchema
);
