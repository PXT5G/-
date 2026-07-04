import mongoose, { Schema, Document, Types } from 'mongoose';

export type ContactType = 'personal' | 'business' | 'emergency';
export type ContactStatus = 'active' | 'archived';
export type PhoneLabel = 'mobile' | 'home' | 'work' | 'other';

export interface IPhoneNumber {
  number: string;
  label: PhoneLabel;
  primary: boolean;
}

export interface IContact extends Document {
  userId: Types.ObjectId;
  type: ContactType;
  firstName: string;
  lastName?: string;
  fullName: string;
  username?: string;
  phoneNumbers: IPhoneNumber[];
  identityNumber?: string;
  email?: string;
  organizationId?: Types.ObjectId;
  department?: string;
  role?: string;
  status: ContactStatus;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  birthday?: Date;
  notes?: string;
  avatar?: string;
  tags: string[];
  customLabels: string[];
  relationshipLabel?: string;
  isFavorite: boolean;
  isBlocked: boolean;
  isEmergency: boolean;
  groupIds: Types.ObjectId[];
  lastContactedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const phoneNumberSchema = new Schema<IPhoneNumber>(
  {
    number: { type: String, required: true },
    label: { type: String, enum: ['mobile', 'home', 'work', 'other'], default: 'mobile' },
    primary: { type: Boolean, default: false },
  },
  { _id: false }
);

const contactSchema = new Schema<IContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['personal', 'business', 'emergency'], default: 'personal' },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    fullName: { type: String, required: true, index: true },
    username: { type: String, trim: true, sparse: true },
    phoneNumbers: { type: [phoneNumberSchema], default: [], validate: [(v: IPhoneNumber[]) => v.length > 0, 'At least one phone number required'] },
    identityNumber: { type: String, index: true },
    email: { type: String, trim: true, lowercase: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    department: { type: String },
    role: { type: String },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    birthday: { type: Date },
    notes: { type: String },
    avatar: { type: String },
    tags: { type: [String], default: [] },
    customLabels: { type: [String], default: [] },
    relationshipLabel: { type: String },
    isFavorite: { type: Boolean, default: false, index: true },
    isBlocked: { type: Boolean, default: false, index: true },
    isEmergency: { type: Boolean, default: false, index: true },
    groupIds: [{ type: Schema.Types.ObjectId, ref: 'ContactGroup' }],
    lastContactedAt: { type: Date },
  },
  { timestamps: true }
);

contactSchema.index({ userId: 1, fullName: 1 });
contactSchema.index({ userId: 1, 'phoneNumbers.number': 1 });
contactSchema.index({ userId: 1, tags: 1 });
contactSchema.index({ userId: 1, lastContactedAt: -1 });

contactSchema.pre('save', function (next) {
  this.fullName = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
  if (this.phoneNumbers.length > 0 && !this.phoneNumbers.some((p) => p.primary)) {
    this.phoneNumbers[0].primary = true;
  }
  next();
});

export const Contact = mongoose.model<IContact>('Contact', contactSchema);

export function buildFullName(firstName: string, lastName?: string): string {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

export function getPrimaryPhone(contact: IContact): string | undefined {
  const primary = contact.phoneNumbers.find((p) => p.primary);
  return primary?.number ?? contact.phoneNumbers[0]?.number;
}
