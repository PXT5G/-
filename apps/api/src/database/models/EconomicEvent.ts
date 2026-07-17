import mongoose, { Schema, Document, Types } from 'mongoose';
import type { EconomyEventType } from '../../constants/economy';

export interface IEconomicEvent extends Document {
  eventId: string;
  type: EconomyEventType | string;
  title: string;
  description: string;
  sector?: string;
  impact: number;
  durationHours: number;
  startsAt: Date;
  endsAt?: Date;
  active: boolean;
  createdBy?: Types.ObjectId;
  metadata: Record<string, unknown>;
}

const economicEventSchema = new Schema<IEconomicEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    sector: { type: String, index: true },
    impact: { type: Number, default: 0, min: -1, max: 1 },
    durationHours: { type: Number, default: 24 },
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const EconomicEvent = mongoose.model<IEconomicEvent>('EconomicEvent', economicEventSchema);
