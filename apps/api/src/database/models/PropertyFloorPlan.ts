import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPropertyFloorPlan extends Document {
  floorPlanId: string;
  propertyId: string;
  url: string;
  floor: number;
  label?: string;
  squareMeters?: number;
  uploadedBy: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const propertyFloorPlanSchema = new Schema<IPropertyFloorPlan>(
  {
    floorPlanId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    url: { type: String, required: true },
    floor: { type: Number, default: 1 },
    label: { type: String },
    squareMeters: { type: Number },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const PropertyFloorPlan = mongoose.model<IPropertyFloorPlan>('PropertyFloorPlan', propertyFloorPlanSchema);
