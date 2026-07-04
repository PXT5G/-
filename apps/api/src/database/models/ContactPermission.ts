import mongoose, { Schema, Document, Types } from 'mongoose';

export type ContactPermissionName =
  | 'view_contacts'
  | 'edit_contacts'
  | 'delete_contacts'
  | 'export_contacts'
  | 'import_contacts'
  | 'manage_groups'
  | 'view_audit_logs'
  | 'manage_organizations'
  | 'block_contacts';

export interface IContactPermission extends Document {
  userId: Types.ObjectId;
  permission: ContactPermissionName;
  granted: boolean;
  grantedBy: Types.ObjectId;
  grantedAt: Date;
  revokedAt?: Date;
}

const contactPermissionSchema = new Schema<IContactPermission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    permission: {
      type: String,
      enum: [
        'view_contacts', 'edit_contacts', 'delete_contacts', 'export_contacts',
        'import_contacts', 'manage_groups', 'view_audit_logs', 'manage_organizations', 'block_contacts',
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

contactPermissionSchema.index({ userId: 1, permission: 1 }, { unique: true });

export const ContactPermission = mongoose.model<IContactPermission>('ContactPermission', contactPermissionSchema);

export const USER_DEFAULT_CONTACT_PERMISSIONS: ContactPermissionName[] = [
  'view_contacts', 'edit_contacts', 'delete_contacts', 'export_contacts', 'import_contacts', 'block_contacts',
];

export const ADMIN_CONTACT_PERMISSIONS: ContactPermissionName[] = [
  'view_contacts', 'edit_contacts', 'delete_contacts', 'export_contacts', 'import_contacts',
  'manage_groups', 'view_audit_logs', 'manage_organizations', 'block_contacts',
];
