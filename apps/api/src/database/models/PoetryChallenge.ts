import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoetryChallenge extends Document {
  challengeId: string;
  title: string;
  prompt: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  hostId: Types.ObjectId;
  entryPoemIds: string[];
  category?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const poetryChallengeSchema = new Schema<IPoetryChallenge>(
  {
    challengeId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    prompt: { type: String, required: true },
    status: { type: String, required: true, index: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    entryPoemIds: { type: [String], default: [] },
    category: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoetryChallenge = mongoose.model<IPoetryChallenge>('PoetryChallenge', poetryChallengeSchema);
