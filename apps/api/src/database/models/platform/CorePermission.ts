import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICorePermission extends Document {
  appId: string;
  userId: Types.ObjectId;
  permission: string;
  granted: boolean;
  grantedBy: Types.ObjectId;
  grantedAt: Date;
  revokedAt?: Date;
  metadata?: Record<string, unknown>;
}

const corePermissionSchema = new Schema<ICorePermission>(
  {
    appId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    permission: { type: String, required: true },
    granted: { type: Boolean, default: true },
    grantedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    grantedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

corePermissionSchema.index({ appId: 1, userId: 1, permission: 1 }, { unique: true });

export const CorePermission = mongoose.model<ICorePermission>('CorePermission', corePermissionSchema);
