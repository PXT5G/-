import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IAircraftSale extends Document {
  saleId: string;
  aircraftId: string;
  dealerId?: string;
  companyId?: string;
  buyerUserId: Types.ObjectId;
  sellerUserId: Types.ObjectId;
  salePrice: number;
  taxAmount: number;
  commission: number;
  tradeInAircraftId?: string;
  tradeInValue?: number;
  paymentType: 'cash' | 'installment' | 'bank_financing' | 'leasing' | 'trade_in';
  financeId?: string;
  offerId?: string;
  status: 'pending' | 'in_escrow' | 'financing' | 'completed' | 'cancelled';
  bankTransactionIds: string[];
  completedAt?: Date;
  signatureHash?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const aircraftSaleSchema = new Schema<IAircraftSale>(
  {
    saleId: { type: String, required: true, unique: true, index: true },
    aircraftId: { type: String, required: true, index: true },
    dealerId: { type: String, index: true },
    companyId: { type: String, index: true },
    buyerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    salePrice: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    tradeInAircraftId: { type: String },
    tradeInValue: { type: Number },
    paymentType: { type: String, enum: ['cash', 'installment', 'bank_financing', 'leasing', 'trade_in'], default: 'cash' },
    financeId: { type: String },
    offerId: { type: String },
    status: { type: String, enum: ['pending', 'in_escrow', 'financing', 'completed', 'cancelled'], default: 'pending', index: true },
    bankTransactionIds: { type: [String], default: [] },
    completedAt: { type: Date },
    signatureHash: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const AircraftSale = mongoose.model<IAircraftSale>('AircraftSale', aircraftSaleSchema);
