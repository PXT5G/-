import mongoose, { Schema, Document, Types } from 'mongoose';

export type VerificationMethod = 'qr' | 'barcode' | 'api' | 'manual' | 'admin';
export type VerificationResult = 'success' | 'failed' | 'expired' | 'suspended';

export interface IVerificationLog extends Document {
  identityId: Types.ObjectId;
  nationalId: string;
  verifiedBy?: Types.ObjectId;
  verifiedByApp?: string;
  method: VerificationMethod;
  result: VerificationResult;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const verificationLogSchema = new Schema<IVerificationLog>(
  {
    identityId: { type: Schema.Types.ObjectId, ref: 'Identity', index: true },
    nationalId: { type: String, required: true, index: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedByApp: { type: String },
    method: {
      type: String,
      enum: ['qr', 'barcode', 'api', 'manual', 'admin'],
      required: true,
    },
    result: {
      type: String,
      enum: ['success', 'failed', 'expired', 'suspended'],
      required: true,
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const VerificationLog = mongoose.model<IVerificationLog>('VerificationLog', verificationLogSchema);
