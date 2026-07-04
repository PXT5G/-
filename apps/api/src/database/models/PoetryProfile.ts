import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { PoetryRole } from '../../constants/poetry';

export interface IPoetryProfile extends Document {
  userId: Types.ObjectId;
  role: PoetryRole;
  displayName: string;
  bio: string;
  verified: boolean;
  isServerPoet: boolean;
  badges: string[];
  achievements: string[];
  awards: string[];
  followerCount: number;
  followingCount: number;
  poemCount: number;
  totalLikes: number;
  totalViews: number;
  avatarUrl?: string;
  coverImageUrl?: string;
  website?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const poetryProfileSchema = new Schema<IPoetryProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    role: { type: String, required: true, index: true },
    displayName: { type: String, required: true },
    bio: { type: String, default: '' },
    verified: { type: Boolean, default: false, index: true },
    isServerPoet: { type: Boolean, default: false, index: true },
    badges: { type: [String], default: [] },
    achievements: { type: [String], default: [] },
    awards: { type: [String], default: [] },
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    poemCount: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    avatarUrl: { type: String },
    coverImageUrl: { type: String },
    website: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoetryProfile = mongoose.model<IPoetryProfile>('PoetryProfile', poetryProfileSchema);
