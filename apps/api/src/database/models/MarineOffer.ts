import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IMarineOffer extends Document {
  offerId: string;
  vesselId: string;
  buyerUserId: Types.ObjectId;
  sellerUserId?: Types.ObjectId;
  dealerId?: string;
  companyId?: string;
  amount: number;
  tradeInVesselId?: string;
  tradeInValue?: number;
  status: 'pending' | 'countered' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';
  counterAmount?: number;
  counterBy?: Types.ObjectId;
  message?: string;
  negotiationHistory: { amount: number; by: Types.ObjectId; message?: string; at: Date }[];
  expiresAt?: Date;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const marineOfferSchema = new Schema<IMarineOffer>(
  {
    offerId: { type: String, required: true, unique: true, index: true },
    vesselId: { type: String, required: true, index: true },
    buyerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    dealerId: { type: String, index: true },
    companyId: { type: String, index: true },
    amount: { type: Number, required: true, min: 0 },
    tradeInVesselId: { type: String },
    tradeInValue: { type: Number },
    status: { type: String, enum: ['pending', 'countered', 'accepted', 'rejected', 'expired', 'withdrawn'], default: 'pending', index: true },
    counterAmount: { type: Number },
    counterBy: { type: Schema.Types.ObjectId, ref: 'User' },
    message: { type: String },
    negotiationHistory: { type: [{ amount: Number, by: Schema.Types.ObjectId, message: String, at: Date }], default: [] },
    expiresAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const MarineOffer = mongoose.model<IMarineOffer>('MarineOffer', marineOfferSchema);
