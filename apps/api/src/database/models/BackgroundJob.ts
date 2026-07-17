import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export type JobStatus =
  | 'queued'
  | 'running'
  | 'retry'
  | 'cancelled'
  | 'completed'
  | 'failed';

export type JobPriority = 'low' | 'normal' | 'high' | 'critical';
export type JobExecution = 'background' | 'foreground';

export interface IBackgroundJob extends Document {
  userId: Types.ObjectId;
  type: string;
  name: string;
  status: JobStatus;
  priority: JobPriority;
  execution: JobExecution;
  progress: number;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  retryCount: number;
  maxRetries: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  recurringIntervalMs?: number;
  nextRunAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const backgroundJobSchema = new Schema<IBackgroundJob>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, index: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['queued', 'running', 'retry', 'cancelled', 'completed', 'failed'],
      default: 'queued',
      index: true,
    },
    priority: { type: String, enum: ['low', 'normal', 'high', 'critical'], default: 'normal' },
    execution: { type: String, enum: ['background', 'foreground'], default: 'background' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    payload: { type: Schema.Types.Mixed, default: {} },
    result: { type: Schema.Types.Mixed },
    error: { type: String },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    scheduledAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    recurringIntervalMs: { type: Number },
    nextRunAt: { type: Date, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

backgroundJobSchema.index({ userId: 1, status: 1, priority: -1 });
backgroundJobSchema.index({ status: 1, scheduledAt: 1 });

export const BackgroundJob = mongoose.model<IBackgroundJob>('BackgroundJob', backgroundJobSchema);
