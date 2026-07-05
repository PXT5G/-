import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ISecurityProfile extends Document {
  profileId: string;
  userId: Types.ObjectId;
  securityScore: number;
  threatLevel: string;
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  pinEnabled: boolean;
  passkeysEnabled: boolean;
  trustedDeviceCount: number;
  lastAuditAt?: Date;
  recommendations: { id: string; title: string; severity: string; resolved: boolean }[];
  createdAt: Date;
  updatedAt: Date;
}

const securityProfileSchema = new Schema<ISecurityProfile>({
  profileId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  securityScore: { type: Number, default: 70 },
  threatLevel: { type: String, default: 'low' },
  twoFactorEnabled: { type: Boolean, default: false },
  biometricEnabled: { type: Boolean, default: true },
  pinEnabled: { type: Boolean, default: true },
  passkeysEnabled: { type: Boolean, default: false },
  trustedDeviceCount: { type: Number, default: 1 },
  lastAuditAt: Date,
  recommendations: [{ id: String, title: String, severity: String, resolved: Boolean }],
}, { timestamps: true });

export const SecurityProfile = mongoose.model<ISecurityProfile>('SecurityProfile', securityProfileSchema);

export interface ISecurityEvent extends Document {
  eventId: string;
  userId: Types.ObjectId;
  type: string;
  severity: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const securityEventSchema = new Schema<ISecurityEvent>({
  eventId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true, index: true },
  severity: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  metadata: Schema.Types.Mixed,
}, { timestamps: { createdAt: true, updatedAt: false } });

export const SecurityEvent = mongoose.model<ISecurityEvent>('SecurityEvent', securityEventSchema);

export interface ICloudBackup extends Document {
  backupId: string;
  userId: Types.ObjectId;
  backupType: string;
  state: string;
  sizeBytes: number;
  version: number;
  includesApps: boolean;
  includesContacts: boolean;
  includesMessages: boolean;
  includesGallery: boolean;
  includesSettings: boolean;
  encrypted: boolean;
  completedAt?: Date;
  createdAt: Date;
}

const cloudBackupSchema = new Schema<ICloudBackup>({
  backupId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  backupType: { type: String, required: true },
  state: { type: String, default: 'pending', index: true },
  sizeBytes: { type: Number, default: 0 },
  version: { type: Number, default: 1 },
  includesApps: { type: Boolean, default: true },
  includesContacts: { type: Boolean, default: true },
  includesMessages: { type: Boolean, default: true },
  includesGallery: { type: Boolean, default: true },
  includesSettings: { type: Boolean, default: true },
  encrypted: { type: Boolean, default: true },
  completedAt: Date,
}, { timestamps: { createdAt: true, updatedAt: false } });

export const CloudBackup = mongoose.model<ICloudBackup>('CloudBackup', cloudBackupSchema);

export interface IFindMyDevice extends Document {
  deviceId: string;
  userId: Types.ObjectId;
  deviceType: string;
  deviceName: string;
  latitude?: number;
  longitude?: number;
  lastSeenAt?: Date;
  isLost: boolean;
  lostModeEnabled: boolean;
  playSoundEnabled: boolean;
  batteryLevel?: number;
  createdAt: Date;
  updatedAt: Date;
}

const findMyDeviceSchema = new Schema<IFindMyDevice>({
  deviceId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deviceType: { type: String, required: true },
  deviceName: { type: String, required: true },
  latitude: Number,
  longitude: Number,
  lastSeenAt: Date,
  isLost: { type: Boolean, default: false },
  lostModeEnabled: { type: Boolean, default: false },
  playSoundEnabled: { type: Boolean, default: false },
  batteryLevel: Number,
}, { timestamps: true });

export const FindMyDevice = mongoose.model<IFindMyDevice>('FindMyDevice', findMyDeviceSchema);

export interface IUpdateChannel extends Document {
  channelId: string;
  userId: Types.ObjectId;
  channel: string;
  autoUpdate: boolean;
  lastCheckAt?: Date;
  pendingUpdates: { bundleId: string; version: string; size: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const updateChannelSchema = new Schema<IUpdateChannel>({
  channelId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  channel: { type: String, default: 'stable' },
  autoUpdate: { type: Boolean, default: true },
  lastCheckAt: Date,
  pendingUpdates: [{ bundleId: String, version: String, size: Number }],
}, { timestamps: true });

export const UpdateChannel = mongoose.model<IUpdateChannel>('UpdateChannel', updateChannelSchema);

export interface IEnterpriseOrganization extends Document {
  orgId: string;
  name: string;
  ownerId: Types.ObjectId;
  departments: { id: string; name: string }[];
  managedDeviceCount: number;
  policyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const enterpriseOrgSchema = new Schema<IEnterpriseOrganization>({
  orgId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  departments: [{ id: String, name: String }],
  managedDeviceCount: { type: Number, default: 0 },
  policyCount: { type: Number, default: 0 },
}, { timestamps: true });

export const EnterpriseOrganization = mongoose.model<IEnterpriseOrganization>('EnterpriseOrganization', enterpriseOrgSchema);
