import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITemporaryPass extends Document {
  identityId: Types.ObjectId;
  userId: Types.ObjectId;
  code: string;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

const temporaryPassSchema = new Schema<ITemporaryPass>(
  {
    identityId: { type: Schema.Types.ObjectId, ref: 'Identity', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    code: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

temporaryPassSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TemporaryPass = mongoose.model<ITemporaryPass>('TemporaryPass', temporaryPassSchema);
