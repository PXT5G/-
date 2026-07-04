import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { OwnershipType } from '../../constants/realEstate';

export interface IPropertyOwner extends Document {
  ownerRecordId: string;
  propertyId: string;
  ownerType: OwnershipType;
  userId?: Types.ObjectId;
  companyId?: string;
  businessOwnerId?: string;
  name: string;
  sharePercent: number;
  isPrimary: boolean;
  acquiredAt: Date;
  releasedAt?: Date;
  transferDocumentId?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const propertyOwnerSchema = new Schema<IPropertyOwner>(
  {
    ownerRecordId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    ownerType: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    companyId: { type: String, index: true },
    businessOwnerId: { type: String },
    name: { type: String, required: true },
    sharePercent: { type: Number, default: 100, min: 0, max: 100 },
    isPrimary: { type: Boolean, default: false },
    acquiredAt: { type: Date, default: Date.now },
    releasedAt: { type: Date },
    transferDocumentId: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PropertyOwner = mongoose.model<IPropertyOwner>('PropertyOwner', propertyOwnerSchema);
