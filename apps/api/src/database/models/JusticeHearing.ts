import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { HearingStatus, HearingType } from '../../constants/justice';

export interface IJusticeHearing extends Document {
  hearingId: string;
  caseId: string;
  caseNumber: string;
  title: string;
  hearingType: HearingType;
  status: HearingStatus;
  scheduledAt: Date;
  endAt?: Date;
  courtroomId: string;
  judgeEmployeeId?: string;
  prosecutorEmployeeId?: string;
  defenseAttorneyEmployeeId?: string;
  clerkEmployeeId?: string;
  notes: string[];
  calendarEventId?: string;
  liveUpdates: { at: Date; message: string; employeeId?: string }[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceHearingSchema = new Schema<IJusticeHearing>(
  {
    hearingId: { type: String, required: true, unique: true, index: true },
    caseId: { type: String, required: true, index: true },
    caseNumber: { type: String, required: true, index: true },
    title: { type: String, required: true },
    hearingType: { type: String, enum: ['arraignment', 'pretrial', 'motion', 'sentencing', 'appeal', 'warrant', 'bail', 'status'], required: true },
    status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'postponed', 'cancelled'], default: 'scheduled', index: true },
    scheduledAt: { type: Date, required: true, index: true },
    endAt: { type: Date },
    courtroomId: { type: String, required: true, index: true },
    judgeEmployeeId: { type: String, index: true },
    prosecutorEmployeeId: { type: String },
    defenseAttorneyEmployeeId: { type: String },
    clerkEmployeeId: { type: String },
    notes: { type: [String], default: [] },
    calendarEventId: { type: String },
    liveUpdates: [{
      at: { type: Date, required: true },
      message: { type: String, required: true },
      employeeId: { type: String },
    }],
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeHearing = mongoose.model<IJusticeHearing>('JusticeHearing', justiceHearingSchema);
