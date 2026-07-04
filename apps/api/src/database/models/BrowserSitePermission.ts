import mongoose, { Schema, Document, Types } from 'mongoose';
import type { SitePermissionType } from '../../constants/browser';

export interface IBrowserSitePermission extends Document {
  permissionId: string;
  userId: Types.ObjectId;
  origin: string;
  permission: SitePermissionType;
  granted: boolean;
  updatedAt?: Date;
  createdAt?: Date;
}

const browserSitePermissionSchema = new Schema<IBrowserSitePermission>(
  {
    permissionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    origin: { type: String, required: true, index: true },
    permission: { type: String, required: true },
    granted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

browserSitePermissionSchema.index({ userId: 1, origin: 1, permission: 1 }, { unique: true });

export const BrowserSitePermission = mongoose.model<IBrowserSitePermission>('BrowserSitePermission', browserSitePermissionSchema);
