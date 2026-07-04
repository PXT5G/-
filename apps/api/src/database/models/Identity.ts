import mongoose, { Schema, Document, Types } from 'mongoose';

export type MembershipLevel = 'standard' | 'silver' | 'gold' | 'platinum';
export type IdentityStatus = 'pending' | 'verified' | 'suspended' | 'expired' | 'rejected';

export interface IIdentity extends Document {
  userId: Types.ObjectId;
  fullName: string;
  username: string;
  nationalId: string;
  membershipNumber: string;
  membershipLevel: MembershipLevel;
  country: string;
  photo?: string;
  banner?: string;
  biography?: string;
  organization?: string;
  department?: string;
  role?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  additionalInfo?: string;
  digitalSignature?: string;
  issueDate: Date;
  expiryDate: Date;
  status: IdentityStatus;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  qrPayload: string;
  barcodeValue: string;
  badges: string[];
  achievements: string[];
  profileStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const identitySchema = new Schema<IIdentity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    nationalId: { type: String, required: true, unique: true, index: true },
    membershipNumber: { type: String, required: true, unique: true },
    membershipLevel: {
      type: String,
      enum: ['standard', 'silver', 'gold', 'platinum'],
      default: 'standard',
    },
    country: { type: String, required: true, default: 'Banana Republic' },
    photo: { type: String },
    banner: { type: String },
    biography: { type: String, maxlength: 500 },
    organization: { type: String },
    department: { type: String },
    role: { type: String },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    additionalInfo: { type: String, maxlength: 1000 },
    digitalSignature: { type: String },
    issueDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'verified', 'suspended', 'expired', 'rejected'],
      default: 'pending',
    },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    qrPayload: { type: String, required: true },
    barcodeValue: { type: String, required: true },
    badges: [{ type: String }],
    achievements: [{ type: String }],
    profileStatus: { type: String, default: 'active' },
  },
  { timestamps: true }
);

identitySchema.index({ nationalId: 1 });
identitySchema.index({ membershipNumber: 1 });
identitySchema.index({ status: 1 });

export const Identity = mongoose.model<IIdentity>('Identity', identitySchema);

export function generateNationalId(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(100000 + Math.random() * 900000);
  return `BN-${year}-${num}`;
}

export function generateMembershipNumber(): string {
  const num = Math.floor(10000000 + Math.random() * 90000000);
  return `MBR-${num}`;
}
