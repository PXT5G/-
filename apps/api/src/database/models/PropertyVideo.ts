import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPropertyVideo extends Document {
  videoId: string;
  propertyId: string;
  url: string;
  title?: string;
  duration?: number;
  thumbnailUrl?: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const propertyVideoSchema = new Schema<IPropertyVideo>(
  {
    videoId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    url: { type: String, required: true },
    title: { type: String },
    duration: { type: Number },
    thumbnailUrl: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const PropertyVideo = mongoose.model<IPropertyVideo>('PropertyVideo', propertyVideoSchema);
