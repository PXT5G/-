import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPropertyOffer extends Document {
  offerId: string;
  propertyId: string;
  buyerUserId: Types.ObjectId;
  sellerUserId?: Types.ObjectId;
  companyId?: string;
  amount: number;
  currency: string;
  type: 'purchase' | 'rental';
  status: 'pending' | 'countered' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';
  counterAmount?: number;
  counterBy?: Types.ObjectId;
  message?: string;
  expiresAt?: Date;
  negotiationHistory: { amount: number; by: Types.ObjectId; message?: string; at: Date }[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const propertyOfferSchema = new Schema<IPropertyOffer>(
  {
    offerId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    buyerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    companyId: { type: String, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'GULF' },
    type: { type: String, enum: ['purchase', 'rental'], required: true },
    status: { type: String, enum: ['pending', 'countered', 'accepted', 'rejected', 'expired', 'withdrawn'], default: 'pending', index: true },
    counterAmount: { type: Number },
    counterBy: { type: Schema.Types.ObjectId, ref: 'User' },
    message: { type: String },
    expiresAt: { type: Date },
    negotiationHistory: { type: [{ amount: Number, by: Schema.Types.ObjectId, message: String, at: Date }], default: [] },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PropertyOffer = mongoose.model<IPropertyOffer>('PropertyOffer', propertyOfferSchema);
