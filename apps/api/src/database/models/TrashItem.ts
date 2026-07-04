import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITrashItem extends Document {
  userId: Types.ObjectId;
  bundleId: string;
  name: string;
  type: 'photo' | 'video' | 'document' | 'download' | 'other';
  sizeBytes: number;
  deletedAt: Date;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
}

const trashItemSchema = new Schema<ITrashItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bundleId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['photo', 'video', 'document', 'download', 'other'], default: 'other' },
    sizeBytes: { type: Number, required: true },
    deletedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: false }
);

trashItemSchema.index({ expiresAt: 1 });

export const TrashItem = mongoose.model<ITrashItem>('TrashItem', trashItemSchema);
