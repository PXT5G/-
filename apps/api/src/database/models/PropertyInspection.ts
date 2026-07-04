import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPropertyInspection extends Document {
  inspectionId: string;
  propertyId: string;
  type: 'routine' | 'pre_sale' | 'pre_lease' | 'government' | 'safety' | 'energy';
  inspectorUserId: Types.ObjectId;
  status: 'scheduled' | 'in_progress' | 'passed' | 'failed' | 'follow_up_required';
  scheduledAt: Date;
  completedAt?: Date;
  findings: string;
  score?: number;
  followUpRequired: boolean;
  reportDocumentId?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const propertyInspectionSchema = new Schema<IPropertyInspection>(
  {
    inspectionId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    type: { type: String, enum: ['routine', 'pre_sale', 'pre_lease', 'government', 'safety', 'energy'], required: true },
    inspectorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['scheduled', 'in_progress', 'passed', 'failed', 'follow_up_required'], default: 'scheduled', index: true },
    scheduledAt: { type: Date, required: true },
    completedAt: { type: Date },
    findings: { type: String, default: '' },
    score: { type: Number, min: 0, max: 100 },
    followUpRequired: { type: Boolean, default: false },
    reportDocumentId: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PropertyInspection = mongoose.model<IPropertyInspection>('PropertyInspection', propertyInspectionSchema);
