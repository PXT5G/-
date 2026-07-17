import mongoose, { Schema, Document, Types } from 'mongoose';

export type AppMemoryState = 'active' | 'background' | 'frozen' | 'cached' | 'stopped';

export interface IAppMemory extends Document {
  userId: Types.ObjectId;
  bundleId: string;
  appName: string;
  baseRam: number;
  activeRam: number;
  backgroundRam: number;
  cachedRam: number;
  currentRam: number;
  state: AppMemoryState;
  lastActiveAt: Date;
  updatedAt: Date;
}

const appMemorySchema = new Schema<IAppMemory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bundleId: { type: String, required: true },
    appName: { type: String, default: '' },
    baseRam: { type: Number, default: 0 },
    activeRam: { type: Number, default: 0 },
    backgroundRam: { type: Number, default: 0 },
    cachedRam: { type: Number, default: 0 },
    currentRam: { type: Number, default: 0 },
    state: {
      type: String,
      enum: ['active', 'background', 'frozen', 'cached', 'stopped'],
      default: 'stopped',
    },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

appMemorySchema.index({ userId: 1, bundleId: 1 }, { unique: true });

export const AppMemory = mongoose.model<IAppMemory>('AppMemory', appMemorySchema);
