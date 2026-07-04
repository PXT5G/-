import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IDiagnosticsSnapshot extends Document {
  userId: Types.ObjectId;
  memory: { used: number; total: number; pressure: boolean };
  cpu: { load: number; model: string };
  gpu: { load: number; model: string };
  fps: number;
  storage: { used: number; total: number; health: number };
  network: { latency: number; bandwidth: number; connected: boolean };
  battery: { level: number; health: number; charging: boolean };
  temperature: number;
  backgroundJobs: { running: number; queued: number; failed: number };
  socketConnected: boolean;
  serviceHealth: Record<string, 'healthy' | 'degraded' | 'down'>;
  queryCacheHits: number;
  diagnosticErrors: string[];
  warnings: string[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const diagnosticsSnapshotSchema = new Schema<IDiagnosticsSnapshot>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    memory: {
      used: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      pressure: { type: Boolean, default: false },
    },
    cpu: { load: { type: Number, default: 0 }, model: { type: String, default: '' } },
    gpu: { load: { type: Number, default: 0 }, model: { type: String, default: '' } },
    fps: { type: Number, default: 60 },
    storage: {
      used: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      health: { type: Number, default: 100 },
    },
    network: {
      latency: { type: Number, default: 0 },
      bandwidth: { type: Number, default: 0 },
      connected: { type: Boolean, default: true },
    },
    battery: {
      level: { type: Number, default: 100 },
      health: { type: Number, default: 100 },
      charging: { type: Boolean, default: false },
    },
    temperature: { type: Number, default: 32 },
    backgroundJobs: {
      running: { type: Number, default: 0 },
      queued: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    socketConnected: { type: Boolean, default: false },
    serviceHealth: { type: Schema.Types.Mixed, default: {} },
    queryCacheHits: { type: Number, default: 0 },
    diagnosticErrors: [{ type: String }],
    warnings: [{ type: String }],
    ...auditSchemaFields,
  },
  { timestamps: true }
);

diagnosticsSnapshotSchema.index({ userId: 1, createdAt: -1 });

export const DiagnosticsSnapshot = mongoose.model<IDiagnosticsSnapshot>(
  'DiagnosticsSnapshot',
  diagnosticsSnapshotSchema
);
