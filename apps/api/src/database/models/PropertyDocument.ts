import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPropertyDocument extends Document {
  documentId: string;
  propertyId: string;
  title: string;
  type: 'deed' | 'contract' | 'inspection' | 'insurance' | 'permit' | 'lease' | 'other';
  url: string;
  signatureHash?: string;
  signedBy?: mongoose.Types.ObjectId;
  signedAt?: Date;
  uploadedBy: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const propertyDocumentSchema = new Schema<IPropertyDocument>(
  {
    documentId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['deed', 'contract', 'inspection', 'insurance', 'permit', 'lease', 'other'], required: true },
    url: { type: String, required: true },
    signatureHash: { type: String },
    signedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    signedAt: { type: Date },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const PropertyDocument = mongoose.model<IPropertyDocument>('PropertyDocument', propertyDocumentSchema);
