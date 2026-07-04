import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ISystemEvent extends Document {
  userId?: Types.ObjectId;
  namespace: string;
  event: string;
  payload: Record<string, unknown>;
  priority: number;
  replayable: boolean;
  source: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const systemEventSchema = new Schema<ISystemEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    namespace: { type: String, required: true, index: true },
    event: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    priority: { type: Number, default: 0 },
    replayable: { type: Boolean, default: true },
    source: { type: String, default: 'system' },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

systemEventSchema.index({ namespace: 1, event: 1, createdAt: -1 });
systemEventSchema.index({ createdAt: -1 });

export const SystemEvent = mongoose.model<ISystemEvent>('SystemEvent', systemEventSchema);
