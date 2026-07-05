import mongoose, { Schema, Document, Types } from 'mongoose';
import type { AutomationStatus, TriggerType, AutomationActionType, RunStatus } from '../../constants/automation';
import { auditSchemaFields } from '../baseSchema';

export interface IAutomationTrigger {
  triggerId: string;
  type: TriggerType;
  config: Record<string, unknown>;
}

export interface IAutomationAction {
  actionId: string;
  type: AutomationActionType;
  config: Record<string, unknown>;
  order: number;
}

export interface IAutomationCondition {
  conditionId: string;
  field: string;
  operator: string;
  value: unknown;
  logic?: 'and' | 'or';
}

export interface IAutomation extends Document {
  automationId: string;
  userId: Types.ObjectId;
  name: string;
  description?: string;
  status: AutomationStatus;
  triggers: IAutomationTrigger[];
  conditions: IAutomationCondition[];
  actions: IAutomationAction[];
  variables: Record<string, unknown>;
  runCount: number;
  lastRunAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const automationSchema = new Schema<IAutomation>(
  {
    automationId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    description: String,
    status: { type: String, required: true, default: 'draft', index: true },
    triggers: [{
      triggerId: String,
      type: String,
      config: Schema.Types.Mixed,
    }],
    conditions: [{
      conditionId: String,
      field: String,
      operator: String,
      value: Schema.Types.Mixed,
      logic: String,
    }],
    actions: [{
      actionId: String,
      type: String,
      config: Schema.Types.Mixed,
      order: Number,
    }],
    variables: { type: Schema.Types.Mixed, default: {} },
    runCount: { type: Number, default: 0 },
    lastRunAt: Date,
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Automation = mongoose.model<IAutomation>('Automation', automationSchema);

export interface IAutomationRun extends Document {
  runId: string;
  automationId: string;
  userId: Types.ObjectId;
  status: RunStatus;
  triggerType?: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  actionsExecuted: number;
  errorMessage?: string;
  logs: { timestamp: Date; message: string; level: string }[];
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const automationRunSchema = new Schema<IAutomationRun>(
  {
    runId: { type: String, required: true, unique: true, index: true },
    automationId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, required: true, default: 'pending', index: true },
    triggerType: String,
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    durationMs: Number,
    actionsExecuted: { type: Number, default: 0 },
    errorMessage: String,
    logs: [{ timestamp: Date, message: String, level: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

automationRunSchema.index({ userId: 1, startedAt: -1 });

export const AutomationRun = mongoose.model<IAutomationRun>('AutomationRun', automationRunSchema);
