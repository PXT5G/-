import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPoliceProperty extends Document {
  propertyId: string;
  address: string;
  ownerName: string;
  ownerIdentityNumber?: string;
  type: 'residential' | 'commercial' | 'industrial' | 'other';
  status: 'clear' | 'flagged' | 'under_surveillance';
  notes?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const policePropertySchema = new Schema<IPoliceProperty>(
  {
    propertyId: { type: String, required: true, unique: true, index: true },
    address: { type: String, required: true, index: true },
    ownerName: { type: String, required: true, index: true },
    ownerIdentityNumber: { type: String, index: true },
    type: { type: String, enum: ['residential', 'commercial', 'industrial', 'other'], default: 'residential' },
    status: { type: String, enum: ['clear', 'flagged', 'under_surveillance'], default: 'clear' },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const PoliceProperty = mongoose.model<IPoliceProperty>('PoliceProperty', policePropertySchema);
