import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ActionType, ActionStatus } from '../../constants/assistant';
import { auditSchemaFields } from '../baseSchema';

export interface IAssistantAction extends Document {
  actionId: string;
  userId: Types.ObjectId;
  conversationId: string;
  sessionId?: string;
  actionType: ActionType;
  status: ActionStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  requiresConfirmation: boolean;
  confirmedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const assistantActionSchema = new Schema<IAssistantAction>(
  {
    actionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: { type: String, required: true, index: true },
    sessionId: String,
    actionType: { type: String, required: true, index: true },
    status: { type: String, required: true, default: 'pending', index: true },
    input: { type: Schema.Types.Mixed, default: {} },
    output: Schema.Types.Mixed,
    requiresConfirmation: { type: Boolean, default: false },
    confirmedAt: Date,
    completedAt: Date,
    errorMessage: String,
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const AssistantAction = mongoose.model<IAssistantAction>('AssistantAction', assistantActionSchema);
