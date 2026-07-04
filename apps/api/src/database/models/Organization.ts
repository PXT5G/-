import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrganization extends Document {
  userId: Types.ObjectId;
  name: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    industry: { type: String },
    website: { type: String },
    email: { type: String },
    phone: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

organizationSchema.index({ userId: 1, name: 1 });

export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);
