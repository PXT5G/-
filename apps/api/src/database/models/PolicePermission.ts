import mongoose, { Schema, Document, Types } from 'mongoose';

export type PolicePermissionName =
  | 'view_dashboard'
  | 'access_mdt'
  | 'view_mdt_audit'
  | 'create_report'
  | 'approve_report'
  | 'view_reports'
  | 'manage_rankings'
  | 'view_officers'
  | 'manage_officers'
  | 'manage_dispatch'
  | 'view_dispatch'
  | 'manage_cases'
  | 'view_cases'
  | 'manage_vehicles'
  | 'view_vehicles'
  | 'internal_chat'
  | 'view_audit_logs'
  | 'manage_evidence';

export type PoliceRank = 'cadet' | 'officer' | 'sergeant' | 'lieutenant' | 'captain' | 'chief';

export interface IPolicePermission extends Document {
  userId: Types.ObjectId;
  permission: PolicePermissionName;
  granted: boolean;
  grantedBy: Types.ObjectId;
  grantedAt: Date;
  revokedAt?: Date;
}

const policePermissionSchema = new Schema<IPolicePermission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    permission: {
      type: String,
      enum: [
        'view_dashboard', 'access_mdt', 'view_mdt_audit', 'create_report', 'approve_report',
        'view_reports', 'manage_rankings', 'view_officers', 'manage_officers', 'manage_dispatch',
        'view_dispatch', 'manage_cases', 'view_cases', 'manage_vehicles', 'view_vehicles',
        'internal_chat', 'view_audit_logs', 'manage_evidence',
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

policePermissionSchema.index({ userId: 1, permission: 1 }, { unique: true });

export const PolicePermission = mongoose.model<IPolicePermission>('PolicePermission', policePermissionSchema);

export const RANK_PERMISSIONS: Record<PoliceRank, PolicePermissionName[]> = {
  cadet: ['view_dashboard', 'view_reports', 'view_dispatch', 'internal_chat'],
  officer: ['view_dashboard', 'access_mdt', 'create_report', 'view_reports', 'view_dispatch', 'view_cases', 'view_vehicles', 'internal_chat'],
  sergeant: ['view_dashboard', 'access_mdt', 'create_report', 'view_reports', 'view_dispatch', 'manage_dispatch', 'view_cases', 'manage_cases', 'view_vehicles', 'view_officers', 'internal_chat', 'manage_evidence'],
  lieutenant: ['view_dashboard', 'access_mdt', 'view_mdt_audit', 'create_report', 'approve_report', 'view_reports', 'view_dispatch', 'manage_dispatch', 'view_cases', 'manage_cases', 'view_vehicles', 'manage_vehicles', 'view_officers', 'manage_rankings', 'internal_chat', 'manage_evidence', 'view_audit_logs'],
  captain: ['view_dashboard', 'access_mdt', 'view_mdt_audit', 'create_report', 'approve_report', 'view_reports', 'view_dispatch', 'manage_dispatch', 'view_cases', 'manage_cases', 'view_vehicles', 'manage_vehicles', 'view_officers', 'manage_officers', 'manage_rankings', 'internal_chat', 'manage_evidence', 'view_audit_logs'],
  chief: [
    'view_dashboard', 'access_mdt', 'view_mdt_audit', 'create_report', 'approve_report', 'view_reports',
    'manage_rankings', 'view_officers', 'manage_officers', 'manage_dispatch', 'view_dispatch',
    'manage_cases', 'view_cases', 'manage_vehicles', 'view_vehicles', 'internal_chat', 'view_audit_logs', 'manage_evidence',
  ],
};

export const ADMIN_POLICE_PERMISSIONS: PolicePermissionName[] = RANK_PERMISSIONS.chief;
