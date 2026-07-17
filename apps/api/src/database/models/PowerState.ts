import mongoose, { Schema, Document, Types } from 'mongoose';
import type { BootPhase } from '../../constants/phoneOs';
import { auditSchemaFields } from '../baseSchema';

export interface IPowerState extends Document {
  userId: Types.ObjectId;
  isPoweredOn: boolean;
  bootPhase: BootPhase;
  lastBootAt?: Date;
  lastShutdownAt?: Date;
  lastRestartAt?: Date;
  crashRecoveryPending: boolean;
  emergencyRestartCount: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const powerStateSchema = new Schema<IPowerState>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    isPoweredOn: { type: Boolean, default: true },
    bootPhase: {
      type: String,
      enum: ['off', 'booting', 'splash', 'locked', 'home', 'recovery', 'safe'],
      default: 'home',
    },
    lastBootAt: { type: Date, default: Date.now },
    lastShutdownAt: { type: Date },
    lastRestartAt: { type: Date },
    crashRecoveryPending: { type: Boolean, default: false },
    emergencyRestartCount: { type: Number, default: 0 },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PowerState = mongoose.model<IPowerState>('PowerState', powerStateSchema);
