import mongoose, { Schema, Document, Types } from 'mongoose';
import type { RealEstateRole, RealEstatePermission } from '../../constants/realEstate';

export interface IPropertyRole extends Document {
  role: RealEstateRole;
  permissions: RealEstatePermission[];
  updatedBy?: Types.ObjectId;
}

const propertyRoleSchema = new Schema<IPropertyRole>(
  {
    role: { type: String, required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const PropertyRole = mongoose.model<IPropertyRole>('PropertyRole', propertyRoleSchema);
