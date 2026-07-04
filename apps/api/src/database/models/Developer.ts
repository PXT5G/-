import mongoose, { Schema, Document } from 'mongoose';

export interface IDeveloper extends Document {
  slug: string;
  name: string;
  description: string;
  logo: string;
  website?: string;
  email?: string;
  verified: boolean;
  appCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const developerSchema = new Schema<IDeveloper>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    logo: { type: String, default: '🍌' },
    website: { type: String },
    email: { type: String },
    verified: { type: Boolean, default: false },
    appCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Developer = mongoose.model<IDeveloper>('Developer', developerSchema);
