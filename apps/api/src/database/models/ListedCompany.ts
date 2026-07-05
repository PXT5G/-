import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { ListedCompanyType, TradingStatus } from '../../constants/exchange';

export interface IListedCompany extends Document {
  listedCompanyId: string;
  companyId: string;
  exchangeId: string;
  ticker: string;
  name: string;
  sector: string;
  companyType: ListedCompanyType | string;
  ceo?: string;
  description?: string;
  logo?: string;
  listedAt?: Date;
  tradingStatus: TradingStatus;
  isGovernment: boolean;
  ownerUserId?: Types.ObjectId;
  marketCap: number;
  outstandingShares: number;
  availableShares: number;
  economyValuationId?: string;
  lastValuationAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const listedCompanySchema = new Schema<IListedCompany>(
  {
    listedCompanyId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, unique: true, index: true },
    exchangeId: { type: String, required: true, index: true },
    ticker: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    sector: { type: String, required: true, index: true },
    companyType: { type: String, required: true, index: true },
    ceo: { type: String },
    description: { type: String },
    logo: { type: String },
    listedAt: { type: Date },
    tradingStatus: { type: String, enum: ['active', 'halted', 'suspended', 'delisted', 'ipo_pending'], default: 'ipo_pending', index: true },
    isGovernment: { type: Boolean, default: false },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    marketCap: { type: Number, default: 0 },
    outstandingShares: { type: Number, default: 1_000_000 },
    availableShares: { type: Number, default: 1_000_000 },
    economyValuationId: { type: String, index: true },
    lastValuationAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const ListedCompany = mongoose.model<IListedCompany>('ListedCompany', listedCompanySchema);
