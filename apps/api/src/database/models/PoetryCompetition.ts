import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoetryCompetition extends Document {
  competitionId: string;
  title: string;
  description: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  rules: string;
  prizeDescription: string;
  hostId: Types.ObjectId;
  entryPoemIds: string[];
  winnerPoemId?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const poetryCompetitionSchema = new Schema<IPoetryCompetition>(
  {
    competitionId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, required: true, index: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    rules: { type: String, default: '' },
    prizeDescription: { type: String, default: '' },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    entryPoemIds: { type: [String], default: [] },
    winnerPoemId: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoetryCompetition = mongoose.model<IPoetryCompetition>('PoetryCompetition', poetryCompetitionSchema);
