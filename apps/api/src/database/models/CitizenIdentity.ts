import mongoose, { Schema, Document, Types } from 'mongoose';
import type { IdentityStatus, IdentityRole } from '../../constants/identity';
import { auditSchemaFields } from '../baseSchema';

export interface IEmergencyInfo {
  bloodType?: string;
  allergies: string[];
  medications: string[];
  emergencyContacts: { name: string; phone: string; relationship: string }[];
  medicalNotes?: string;
}

export interface ICitizenIdentity extends Document {
  identityId: string;
  userId: Types.ObjectId;
  status: IdentityStatus;
  role: IdentityRole;
  fullName: string;
  nationalId: string;
  dateOfBirth?: Date;
  nationality: string;
  gender?: string;
  photoUrl?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  emergencyInfo: IEmergencyInfo;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  qrCode?: string;
  nfcTagId?: string;
  digitalSignatureHash?: string;
  policeStatus?: string;
  justiceStatus?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const emergencyInfoSchema = new Schema({
  bloodType: String,
  allergies: { type: [String], default: [] },
  medications: { type: [String], default: [] },
  emergencyContacts: [{
    name: String,
    phone: String,
    relationship: String,
  }],
  medicalNotes: String,
}, { _id: false });

const citizenIdentitySchema = new Schema<ICitizenIdentity>(
  {
    identityId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    status: { type: String, required: true, default: 'pending', index: true },
    role: { type: String, required: true, default: 'citizen' },
    fullName: { type: String, required: true },
    nationalId: { type: String, required: true, unique: true, index: true },
    dateOfBirth: Date,
    nationality: { type: String, default: 'GULF' },
    gender: String,
    photoUrl: String,
    address: String,
    city: String,
    postalCode: String,
    phone: String,
    email: String,
    emergencyInfo: { type: emergencyInfoSchema, default: () => ({ allergies: [], medications: [], emergencyContacts: [] }) },
    verifiedAt: Date,
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    qrCode: String,
    nfcTagId: String,
    digitalSignatureHash: String,
    policeStatus: String,
    justiceStatus: String,
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const CitizenIdentity = mongoose.model<ICitizenIdentity>('CitizenIdentity', citizenIdentitySchema);
