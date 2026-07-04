import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ICompanySupplier extends Document {
  supplierId: string;
  companyId: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
  taxNumber?: string;
  category: string;
  contractIds: string[];
  outstandingBalance: number;
  totalPurchases: number;
  rating: number;
  status: 'active' | 'inactive' | 'blacklisted';
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const companySupplierSchema = new Schema<ICompanySupplier>(
  {
    supplierId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    name: { type: String, required: true, index: true },
    contactName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    taxNumber: { type: String },
    category: { type: String, required: true },
    contractIds: { type: [String], default: [] },
    outstandingBalance: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    status: { type: String, enum: ['active', 'inactive', 'blacklisted'], default: 'active', index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const CompanySupplier = mongoose.model<ICompanySupplier>('CompanySupplier', companySupplierSchema);
