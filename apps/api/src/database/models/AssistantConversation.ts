import mongoose, { Schema, Document, Types } from 'mongoose';
import type { MessageRole } from '../../constants/assistant';
import { auditSchemaFields } from '../baseSchema';

export interface IAssistantConversation extends Document {
  conversationId: string;
  userId: Types.ObjectId;
  title: string;
  summary?: string;
  messageCount: number;
  lastMessageAt?: Date;
  isPinned: boolean;
  context?: Record<string, unknown>;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const assistantConversationSchema = new Schema<IAssistantConversation>(
  {
    conversationId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New Conversation' },
    summary: String,
    messageCount: { type: Number, default: 0 },
    lastMessageAt: Date,
    isPinned: { type: Boolean, default: false },
    context: Schema.Types.Mixed,
    ...auditSchemaFields,
  },
  { timestamps: true }
);

assistantConversationSchema.index({ userId: 1, lastMessageAt: -1 });

export const AssistantConversation = mongoose.model<IAssistantConversation>('AssistantConversation', assistantConversationSchema);

export interface IAssistantMessage {
  messageId: string;
  role: MessageRole;
  content: string;
  toolCalls?: { tool: string; input: Record<string, unknown>; output?: unknown }[];
  createdAt: Date;
}

export interface IAssistantSession extends Document {
  sessionId: string;
  userId: Types.ObjectId;
  conversationId: string;
  messages: IAssistantMessage[];
  memory?: Record<string, unknown>;
  voiceEnabled: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const assistantMessageSchema = new Schema({
  messageId: { type: String, required: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
  toolCalls: [{ tool: String, input: Schema.Types.Mixed, output: Schema.Types.Mixed }],
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const assistantSessionSchema = new Schema<IAssistantSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: { type: String, required: true, index: true },
    messages: { type: [assistantMessageSchema], default: [] },
    memory: Schema.Types.Mixed,
    voiceEnabled: { type: Boolean, default: false },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const AssistantSession = mongoose.model<IAssistantSession>('AssistantSession', assistantSessionSchema);
