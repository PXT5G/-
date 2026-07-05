import mongoose, { Schema, Document, Types } from 'mongoose';
import type { PredictionType, SuggestionType, DashboardType, SearchIndexType } from '../../constants/intelligence';
import { auditSchemaFields } from '../baseSchema';

export interface IPrediction extends Document {
  predictionId: string;
  userId: Types.ObjectId;
  type: PredictionType;
  targetId: string;
  targetLabel: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const predictionSchema = new Schema<IPrediction>(
  {
    predictionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, index: true },
    targetId: { type: String, required: true },
    targetLabel: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    metadata: Schema.Types.Mixed,
    expiresAt: Date,
  },
  { timestamps: true }
);

predictionSchema.index({ userId: 1, type: 1, confidence: -1 });

export const Prediction = mongoose.model<IPrediction>('Prediction', predictionSchema);

export interface ISuggestion extends Document {
  suggestionId: string;
  userId: Types.ObjectId;
  type: SuggestionType;
  title: string;
  subtitle?: string;
  actionType?: string;
  actionPayload?: Record<string, unknown>;
  confidence: number;
  dismissed: boolean;
  createdAt: Date;
}

const suggestionSchema = new Schema<ISuggestion>(
  {
    suggestionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    subtitle: String,
    actionType: String,
    actionPayload: Schema.Types.Mixed,
    confidence: { type: Number, default: 0.5 },
    dismissed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Suggestion = mongoose.model<ISuggestion>('Suggestion', suggestionSchema);

export interface ISearchIndexEntry extends Document {
  entryId: string;
  userId: Types.ObjectId;
  type: SearchIndexType;
  sourceId: string;
  title: string;
  subtitle?: string;
  keywords: string[];
  route?: string;
  metadata?: Record<string, unknown>;
  indexedAt: Date;
  updatedAt: Date;
}

const searchIndexSchema = new Schema<ISearchIndexEntry>(
  {
    entryId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, index: true },
    sourceId: { type: String, required: true },
    title: { type: String, required: true, index: true },
    subtitle: String,
    keywords: { type: [String], default: [], index: true },
    route: String,
    metadata: Schema.Types.Mixed,
    indexedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

searchIndexSchema.index({ userId: 1, title: 'text', keywords: 'text' });

export const SearchIndexEntry = mongoose.model<ISearchIndexEntry>('SearchIndexEntry', searchIndexSchema);

export interface ISearchHistory extends Document {
  historyId: string;
  userId: Types.ObjectId;
  query: string;
  resultCount: number;
  categories?: string[];
  createdAt: Date;
}

const searchHistorySchema = new Schema<ISearchHistory>(
  {
    historyId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    query: { type: String, required: true },
    resultCount: { type: Number, default: 0 },
    categories: [String],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

searchHistorySchema.index({ userId: 1, createdAt: -1 });

export const SearchHistory = mongoose.model<ISearchHistory>('SearchHistory', searchHistorySchema);

export interface IDashboard extends Document {
  dashboardId: string;
  userId: Types.ObjectId;
  type: DashboardType;
  name: string;
  widgets: { widgetId: string; type: string; config: Record<string, unknown>; position: number }[];
  isDefault: boolean;
  lastRefreshedAt?: Date;
  snapshot?: Record<string, unknown>;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const dashboardWidgetSchema = new Schema(
  {
    widgetId: { type: String, required: true },
    type: { type: String, required: true },
    config: { type: Schema.Types.Mixed, default: {} },
    position: { type: Number, default: 0 },
  },
  { _id: false }
);

const dashboardSchema = new Schema<IDashboard>(
  {
    dashboardId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, index: true },
    name: { type: String, required: true },
    widgets: { type: [dashboardWidgetSchema], default: [] },
    isDefault: { type: Boolean, default: false },
    lastRefreshedAt: Date,
    snapshot: Schema.Types.Mixed,
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Dashboard = mongoose.model<IDashboard>('Dashboard', dashboardSchema);

export interface IVoiceSession extends Document {
  sessionId: string;
  userId: Types.ObjectId;
  status: string;
  wakePhrase?: string;
  language: string;
  transcript: string[];
  commands: { command: string; executedAt: Date; success: boolean }[];
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
}

const voiceSessionSchema = new Schema<IVoiceSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, default: 'idle', index: true },
    wakePhrase: String,
    language: { type: String, default: 'en' },
    transcript: { type: [String], default: [] },
    commands: [{ command: String, executedAt: Date, success: Boolean }],
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const VoiceSession = mongoose.model<IVoiceSession>('VoiceSession', voiceSessionSchema);
