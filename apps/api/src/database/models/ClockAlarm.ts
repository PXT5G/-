import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IClockAlarm extends Document {
  userId: Types.ObjectId;
  alarmId: string;
  label: string;
  hour: number;
  minute: number;
  enabled: boolean;
  repeatDays: number[];
  sound: string;
  snoozeMinutes: number;
  sleepScheduleStart?: string;
  sleepScheduleEnd?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const clockAlarmSchema = new Schema<IClockAlarm>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    alarmId: { type: String, required: true },
    label: { type: String, default: 'Alarm' },
    hour: { type: Number, required: true, min: 0, max: 23 },
    minute: { type: Number, required: true, min: 0, max: 59 },
    enabled: { type: Boolean, default: true },
    repeatDays: { type: [Number], default: [] },
    sound: { type: String, default: 'radar' },
    snoozeMinutes: { type: Number, default: 9 },
    sleepScheduleStart: { type: String },
    sleepScheduleEnd: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

clockAlarmSchema.index({ userId: 1, alarmId: 1 }, { unique: true });

export const ClockAlarm = mongoose.model<IClockAlarm>('ClockAlarm', clockAlarmSchema);
