import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ICompanyContract extends Document {
  contractId: string;
  companyId: string;
  title: string;
  type: 'supplier' | 'customer' | 'government' | 'employment' | 'service' | 'lease';
  partyId?: string;
  partyName: string;
  value: number;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  terms?: string;
  signatureHash?: string;
  signedBy?: mongoose.Types.ObjectId;
  signedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const companyContractSchema = new Schema<ICompanyContract>(
  {
    contractId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['supplier', 'customer', 'government', 'employment', 'service', 'lease'],
      required: true,
      index: true,
    },
    partyId: { type: String, index: true },
    partyName: { type: String, required: true },
    value: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'expired', 'terminated'],
      default: 'draft',
      index: true,
    },
    terms: { type: String },
    signatureHash: { type: String },
    signedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    signedAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const CompanyContract = mongoose.model<ICompanyContract>('CompanyContract', companyContractSchema);
