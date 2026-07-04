import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ContactCategory } from '../../constants/contacts';
import { auditSchemaFields } from '../baseSchema';

export interface IContactPhone {
  label: string;
  number: string;
  primary?: boolean;
}

export interface IContactEmail {
  label: string;
  email: string;
  primary?: boolean;
}

export interface IContactAddress {
  label: string;
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  gpsLat?: number;
  gpsLng?: number;
}

export interface IContact extends Document {
  contactId: string;
  userId: Types.ObjectId;
  category: ContactCategory;
  firstName: string;
  lastName: string;
  displayName: string;
  company?: string;
  department?: string;
  jobTitle?: string;
  relationship?: string;
  phones: IContactPhone[];
  emails: IContactEmail[];
  addresses: IContactAddress[];
  website?: string;
  socialLinks: { platform: string; url: string }[];
  iban?: string;
  businessAccountId?: string;
  birthday?: Date;
  notes?: string;
  photoUrl?: string;
  tags: string[];
  groupIds: string[];
  favorite: boolean;
  emergency: boolean;
  blocked: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const phoneSchema = new Schema({ label: String, number: String, primary: Boolean }, { _id: false });
const emailSchema = new Schema({ label: String, email: String, primary: Boolean }, { _id: false });
const addressSchema = new Schema(
  { label: String, street: String, city: String, region: String, postalCode: String, country: String, gpsLat: Number, gpsLng: Number },
  { _id: false }
);

const contactSchema = new Schema<IContact>(
  {
    contactId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, default: '' },
    displayName: { type: String, required: true, index: true },
    company: String,
    department: String,
    jobTitle: String,
    relationship: String,
    phones: { type: [phoneSchema], default: [] },
    emails: { type: [emailSchema], default: [] },
    addresses: { type: [addressSchema], default: [] },
    website: String,
    socialLinks: [{ platform: String, url: String }],
    iban: String,
    businessAccountId: String,
    birthday: Date,
    notes: String,
    photoUrl: String,
    tags: { type: [String], default: [] },
    groupIds: { type: [String], default: [] },
    favorite: { type: Boolean, default: false, index: true },
    emergency: { type: Boolean, default: false },
    blocked: { type: Boolean, default: false, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

contactSchema.index({ userId: 1, displayName: 1 });
contactSchema.index({ userId: 1, deletedAt: 1 });

export const Contact = mongoose.model<IContact>('Contact', contactSchema);
