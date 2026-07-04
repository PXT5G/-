import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { CalendarEventType } from '../../constants/systemApps';

export interface ICalendarEvent extends Document {
  userId: Types.ObjectId;
  eventId: string;
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  location?: string;
  recurrence: string;
  reminderMinutes: number[];
  invitedUserIds: string[];
  metadata: Record<string, unknown>;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const calendarEventSchema = new Schema<ICalendarEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    eventType: { type: String, required: true, index: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    allDay: { type: Boolean, default: false },
    location: { type: String },
    recurrence: { type: String, default: 'none' },
    reminderMinutes: { type: [Number], default: [15] },
    invitedUserIds: { type: [String], default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

calendarEventSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const CalendarEvent = mongoose.model<ICalendarEvent>('CalendarEvent', calendarEventSchema);
