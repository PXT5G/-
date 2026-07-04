import mongoose, { Schema, Document, Types } from 'mongoose';
import type { DocumentType } from '../../constants/identity';
import { auditSchemaFields } from '../baseSchema';

export interface IIdentityDocument extends Document {
  documentId: string;
  userId: Types.ObjectId;
  identityId: string;
  documentType: DocumentType;
  documentNumber: string;
  issuedAt?: Date;
  expiresAt?: Date;
  issuedBy?: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  assetId?: string;
  isVerified: boolean;
  verifiedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const identityDocumentSchema = new Schema<IIdentityDocument>(
  {
    documentId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    identityId: { type: String, required: true, index: true },
    documentType: { type: String, required: true, index: true },
    documentNumber: { type: String, required: true },
    issuedAt: Date,
    expiresAt: Date,
    issuedBy: String,
    title: { type: String, required: true },
    description: String,
    metadata: Schema.Types.Mixed,
    assetId: String,
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    ...auditSchemaFields,
  },
  { timestamps: true }
);

identityDocumentSchema.index({ userId: 1, documentType: 1 });

export const IdentityDocument = mongoose.model<IIdentityDocument>('IdentityDocument', identityDocumentSchema);
