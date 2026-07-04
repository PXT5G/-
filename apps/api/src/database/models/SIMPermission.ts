import mongoose, { Schema, Document, Types } from 'mongoose';

export type SIMPermissionName =
  | 'view_sim'
  | 'edit_sim'
  | 'activate'
  | 'suspend'
  | 'replace'
  | 'generate_numbers'
  | 'assign_numbers'
  | 'manage_carriers'
  | 'view_audit_logs'
  | 'deactivate'
  | 'change_number'
  | 'reserve_number'
  | 'release_number';

export interface ISIMPermission extends Document {
  userId: Types.ObjectId;
  permission: SIMPermissionName;
  granted: boolean;
  grantedBy: Types.ObjectId;
  grantedAt: Date;
  revokedAt?: Date;
}

const simPermissionSchema = new Schema<ISIMPermission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    permission: {
      type: String,
      enum: [
        'view_sim', 'edit_sim', 'activate', 'suspend', 'replace',
        'generate_numbers', 'assign_numbers', 'manage_carriers', 'view_audit_logs',
        'deactivate', 'change_number', 'reserve_number', 'release_number',
      ],
      required: true,
    },
    granted: { type: Boolean, default: true },
    grantedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    grantedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

simPermissionSchema.index({ userId: 1, permission: 1 }, { unique: true });

export const SIMPermission = mongoose.model<ISIMPermission>('SIMPermission', simPermissionSchema);

export const USER_DEFAULT_PERMISSIONS: SIMPermissionName[] = [
  'view_sim', 'edit_sim', 'activate', 'deactivate', 'change_number', 'reserve_number',
];

export const ADMIN_PERMISSIONS: SIMPermissionName[] = [
  'view_sim', 'edit_sim', 'activate', 'suspend', 'replace', 'deactivate',
  'generate_numbers', 'assign_numbers', 'manage_carriers', 'view_audit_logs',
  'change_number', 'reserve_number', 'release_number',
];
