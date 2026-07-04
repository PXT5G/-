import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPropertySale extends Document {
  saleId: string;
  propertyId: string;
  offerId?: string;
  buyerUserId: Types.ObjectId;
  sellerUserId: Types.ObjectId;
  companyId?: string;
  salePrice: number;
  taxAmount: number;
  escrowAmount: number;
  currency: string;
  status: 'pending' | 'in_escrow' | 'completed' | 'cancelled';
  paymentType: 'cash' | 'mortgage' | 'installment' | 'business';
  mortgageId?: string;
  bankTransactionIds: string[];
  contractDocumentId?: string;
  completedAt?: Date;
  signatureHash?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const propertySaleSchema = new Schema<IPropertySale>(
  {
    saleId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    offerId: { type: String, index: true },
    buyerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: String, index: true },
    salePrice: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0 },
    escrowAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'GULF' },
    status: { type: String, enum: ['pending', 'in_escrow', 'completed', 'cancelled'], default: 'pending', index: true },
    paymentType: { type: String, enum: ['cash', 'mortgage', 'installment', 'business'], default: 'cash' },
    mortgageId: { type: String },
    bankTransactionIds: { type: [String], default: [] },
    contractDocumentId: { type: String },
    completedAt: { type: Date },
    signatureHash: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PropertySale = mongoose.model<IPropertySale>('PropertySale', propertySaleSchema);
