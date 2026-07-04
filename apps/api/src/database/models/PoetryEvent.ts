import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoetryEvent extends Document {
  eventId: string;
  title: string;
  description: string;
  eventType: string;
  status: string;
  startsAt: Date;
  endsAt?: Date;
  location?: string;
  hostId: Types.ObjectId;
  poemIds: string[];
  attendeeCount: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const poetryEventSchema = new Schema<IPoetryEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    eventType: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date },
    location: { type: String },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    poemIds: { type: [String], default: [] },
    attendeeCount: { type: Number, default: 0 },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoetryEvent = mongoose.model<IPoetryEvent>('PoetryEvent', poetryEventSchema);
