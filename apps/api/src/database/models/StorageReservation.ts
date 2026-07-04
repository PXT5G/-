import mongoose, { Schema, Document, Types } from 'mongoose';

export type ReservationStatus = 'active' | 'committed' | 'released';

export interface IStorageReservation extends Document {
  userId: Types.ObjectId;
  bundleId: string;
  downloadId?: Types.ObjectId;
  bytes: number;
  status: ReservationStatus;
  expiresAt: Date;
  createdAt: Date;
}

const storageReservationSchema = new Schema<IStorageReservation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bundleId: { type: String, required: true },
    downloadId: { type: Schema.Types.ObjectId, ref: 'StoreDownload' },
    bytes: { type: Number, required: true },
    status: { type: String, enum: ['active', 'committed', 'released'], default: 'active' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

storageReservationSchema.index({ userId: 1, status: 1 });

export const StorageReservation = mongoose.model<IStorageReservation>(
  'StorageReservation',
  storageReservationSchema
);
