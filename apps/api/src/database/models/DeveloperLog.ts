import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDeveloperLog extends Document {
  userId: Types.ObjectId;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const developerLogSchema = new Schema<IDeveloperLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    level: { type: String, enum: ['debug', 'info', 'warn', 'error'], default: 'info', index: true },
    category: { type: String, required: true, index: true },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

developerLogSchema.index({ createdAt: -1 });

export const DeveloperLog = mongoose.model<IDeveloperLog>('DeveloperLog', developerLogSchema);
