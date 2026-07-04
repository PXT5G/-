import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { TrialStatus } from '../../constants/justice';

export interface IJusticeTrial extends Document {
  trialId: string;
  caseId: string;
  caseNumber: string;
  title: string;
  status: TrialStatus;
  scheduledAt: Date;
  courtroomId: string;
  judgeEmployeeId: string;
  prosecutorEmployeeId?: string;
  defenseAttorneyEmployeeId?: string;
  jurySize: number;
  jurySelected: boolean;
  verdict?: 'guilty' | 'not_guilty' | 'hung_jury' | 'mistrial';
  verdictAt?: Date;
  liveUpdates: { at: Date; message: string; employeeId?: string }[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceTrialSchema = new Schema<IJusticeTrial>(
  {
    trialId: { type: String, required: true, unique: true, index: true },
    caseId: { type: String, required: true, index: true },
    caseNumber: { type: String, required: true, index: true },
    title: { type: String, required: true },
    status: { type: String, enum: ['scheduled', 'jury_selection', 'in_progress', 'deliberation', 'verdict', 'completed', 'mistrial'], default: 'scheduled', index: true },
    scheduledAt: { type: Date, required: true, index: true },
    courtroomId: { type: String, required: true, index: true },
    judgeEmployeeId: { type: String, required: true, index: true },
    prosecutorEmployeeId: { type: String },
    defenseAttorneyEmployeeId: { type: String },
    jurySize: { type: Number, default: 12 },
    jurySelected: { type: Boolean, default: false },
    verdict: { type: String, enum: ['guilty', 'not_guilty', 'hung_jury', 'mistrial'] },
    verdictAt: { type: Date },
    liveUpdates: [{
      at: { type: Date, required: true },
      message: { type: String, required: true },
      employeeId: { type: String },
    }],
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeTrial = mongoose.model<IJusticeTrial>('JusticeTrial', justiceTrialSchema);
