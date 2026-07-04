import mongoose, { Schema, Document, Types } from 'mongoose';

export type PhonePermissionName =
  | 'view_dashboard'
  | 'make_call'
  | 'receive_call'
  | 'end_call'
  | 'manage_favorites'
  | 'view_recents'
  | 'view_voicemail'
  | 'manage_voicemail'
  | 'block_numbers'
  | 'emergency_call'
  | 'conference_call'
  | 'record_call'
  | 'manage_settings'
  | 'view_audit_logs';

export interface IPhonePermission extends Document {
  userId: Types.ObjectId;
  permission: PhonePermissionName;
  granted: boolean;
  grantedBy: Types.ObjectId;
  grantedAt: Date;
  revokedAt?: Date;
}

const phonePermissionSchema = new Schema<IPhonePermission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    permission: {
      type: String,
      enum: [
        'view_dashboard', 'make_call', 'receive_call', 'end_call', 'manage_favorites',
        'view_recents', 'view_voicemail', 'manage_voicemail', 'block_numbers',
        'emergency_call', 'conference_call', 'record_call', 'manage_settings', 'view_audit_logs',
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

phonePermissionSchema.index({ userId: 1, permission: 1 }, { unique: true });

export const PhonePermission = mongoose.model<IPhonePermission>('PhonePermission', phonePermissionSchema);

export const USER_DEFAULT_PERMISSIONS: PhonePermissionName[] = [
  'view_dashboard', 'make_call', 'receive_call', 'end_call', 'manage_favorites',
  'view_recents', 'view_voicemail', 'manage_voicemail', 'block_numbers', 'emergency_call',
  'manage_settings',
];

export const ADMIN_PERMISSIONS: PhonePermissionName[] = [
  ...USER_DEFAULT_PERMISSIONS,
  'conference_call', 'record_call', 'view_audit_logs',
];
