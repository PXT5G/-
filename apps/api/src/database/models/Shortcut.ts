import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ShortcutActionType } from '../../constants/shortcuts';
import { auditSchemaFields } from '../baseSchema';

export interface IShortcutAction {
  actionId: string;
  type: ShortcutActionType;
  config: Record<string, unknown>;
  order: number;
}

export interface IShortcut extends Document {
  shortcutId: string;
  userId: Types.ObjectId;
  folderId?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  actions: IShortcutAction[];
  variables: Record<string, unknown>;
  isPinned: boolean;
  isFavorite: boolean;
  runCount: number;
  lastRunAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const shortcutActionSchema = new Schema(
  {
    actionId: { type: String, required: true },
    type: { type: String, required: true },
    config: { type: Schema.Types.Mixed, default: {} },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const shortcutSchema = new Schema<IShortcut>(
  {
    shortcutId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    folderId: String,
    name: { type: String, required: true },
    description: String,
    icon: String,
    color: String,
    actions: { type: [shortcutActionSchema], default: [] },
    variables: { type: Schema.Types.Mixed, default: {} },
    isPinned: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
    runCount: { type: Number, default: 0 },
    lastRunAt: Date,
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Shortcut = mongoose.model<IShortcut>('Shortcut', shortcutSchema);

export interface IShortcutHistory extends Document {
  historyId: string;
  userId: Types.ObjectId;
  shortcutId: string;
  status: 'completed' | 'failed' | 'cancelled';
  durationMs?: number;
  output?: Record<string, unknown>;
  errorMessage?: string;
  createdAt: Date;
}

const shortcutHistorySchema = new Schema<IShortcutHistory>(
  {
    historyId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shortcutId: { type: String, required: true, index: true },
    status: { type: String, required: true },
    durationMs: Number,
    output: Schema.Types.Mixed,
    errorMessage: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ShortcutHistory = mongoose.model<IShortcutHistory>('ShortcutHistory', shortcutHistorySchema);
