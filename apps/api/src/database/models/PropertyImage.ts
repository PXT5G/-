import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPropertyImage extends Document {
  imageId: string;
  propertyId: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  sortOrder: number;
  uploadedBy: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const propertyImageSchema = new Schema<IPropertyImage>(
  {
    imageId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    url: { type: String, required: true },
    caption: { type: String },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const PropertyImage = mongoose.model<IPropertyImage>('PropertyImage', propertyImageSchema);
