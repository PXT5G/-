import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ICompanyCustomer extends Document {
  customerId: string;
  companyId: string;
  userId?: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  purchaseHistory: { invoiceId: string; amount: number; date: Date }[];
  outstandingBalance: number;
  totalSpent: number;
  loyaltyPoints: number;
  reviews: { rating: number; comment?: string; createdAt: Date }[];
  isBlacklisted: boolean;
  blacklistReason?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const companyCustomerSchema = new Schema<ICompanyCustomer>(
  {
    customerId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, index: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    purchaseHistory: {
      type: [{ invoiceId: String, amount: Number, date: Date }],
      default: [],
    },
    outstandingBalance: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    loyaltyPoints: { type: Number, default: 0 },
    reviews: { type: [{ rating: Number, comment: String, createdAt: Date }], default: [] },
    isBlacklisted: { type: Boolean, default: false, index: true },
    blacklistReason: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const CompanyCustomer = mongoose.model<ICompanyCustomer>('CompanyCustomer', companyCustomerSchema);
