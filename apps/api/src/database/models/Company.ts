import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { CompanyStatus } from '../../constants/business';

export interface ICompanyPartner {
  userId?: Types.ObjectId;
  name: string;
  sharePercent?: number;
}

export interface ICompanyShareholder {
  userId?: Types.ObjectId;
  name: string;
  shares: number;
  sharePercent: number;
}

export interface ICompanyHeadquarters {
  address: string;
  city: string;
  district: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface ICompanyBankTransaction {
  transactionId: string;
  type: 'incoming' | 'outgoing' | 'transfer' | 'payroll' | 'tax' | 'loan' | 'freeze' | 'unfreeze';
  amount: number;
  balanceAfter: number;
  account: 'main' | 'payroll' | 'tax' | 'loan';
  description: string;
  reference?: string;
  counterparty?: string;
  createdAt: Date;
}

export interface ICompany extends Document {
  companyId: string;
  name: string;
  tradeName: string;
  licenseNumber: string;
  commercialRegistration: string;
  taxNumber: string;
  category: string;
  ownerUserId: Types.ObjectId;
  partners: ICompanyPartner[];
  shareholders: ICompanyShareholder[];
  headquarters: ICompanyHeadquarters;
  logo?: string;
  banner?: string;
  description?: string;
  website?: string;
  email: string;
  phone: string;
  status: CompanyStatus;
  iban: string;
  walletId: string;
  bankAccountNumber: string;
  cashBalance: number;
  availableBalance: number;
  frozenBalance: number;
  payrollAccountBalance: number;
  taxAccountBalance: number;
  loanAccountBalance: number;
  bankTransactions: ICompanyBankTransaction[];
  licenseExpiry?: Date;
  lastInspection?: Date;
  inspectionStatus?: 'passed' | 'failed' | 'pending';
  violations: number;
  finesOwed: number;
  governmentContractCount: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  operatingCost: number;
  payrollTotal: number;
  inventoryValue: number;
  totalAssets: number;
  totalDebt: number;
  totalLoans: number;
  monthlyIncome: number;
  yearlyIncome: number;
  customerCount: number;
  employeeCount: number;
  categories: string[];
  settings: Record<string, unknown>;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const partnerSchema = new Schema<ICompanyPartner>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    sharePercent: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const shareholderSchema = new Schema<ICompanyShareholder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    shares: { type: Number, default: 0 },
    sharePercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

const bankTransactionSchema = new Schema<ICompanyBankTransaction>(
  {
    transactionId: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    account: { type: String, enum: ['main', 'payroll', 'tax', 'loan'], default: 'main' },
    description: { type: String, required: true },
    reference: { type: String },
    counterparty: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const companySchema = new Schema<ICompany>(
  {
    companyId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    tradeName: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true, index: true },
    commercialRegistration: { type: String, required: true, unique: true, index: true },
    taxNumber: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    partners: { type: [partnerSchema], default: [] },
    shareholders: { type: [shareholderSchema], default: [] },
    headquarters: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true },
      country: { type: String, default: 'GULF' },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    logo: { type: String },
    banner: { type: String },
    description: { type: String },
    website: { type: String },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'under_inspection', 'closed', 'dissolved'],
      default: 'pending',
      index: true,
    },
    iban: { type: String, required: true, unique: true, index: true },
    walletId: { type: String, required: true, unique: true, index: true },
    bankAccountNumber: { type: String, required: true, unique: true, index: true },
    cashBalance: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    frozenBalance: { type: Number, default: 0 },
    payrollAccountBalance: { type: Number, default: 0 },
    taxAccountBalance: { type: Number, default: 0 },
    loanAccountBalance: { type: Number, default: 0 },
    bankTransactions: { type: [bankTransactionSchema], default: [] },
    licenseExpiry: { type: Date },
    lastInspection: { type: Date },
    inspectionStatus: { type: String, enum: ['passed', 'failed', 'pending'] },
    violations: { type: Number, default: 0 },
    finesOwed: { type: Number, default: 0 },
    governmentContractCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    operatingCost: { type: Number, default: 0 },
    payrollTotal: { type: Number, default: 0 },
    inventoryValue: { type: Number, default: 0 },
    totalAssets: { type: Number, default: 0 },
    totalDebt: { type: Number, default: 0 },
    totalLoans: { type: Number, default: 0 },
    monthlyIncome: { type: Number, default: 0 },
    yearlyIncome: { type: Number, default: 0 },
    customerCount: { type: Number, default: 0 },
    employeeCount: { type: Number, default: 0 },
    categories: { type: [String], default: [] },
    settings: { type: Schema.Types.Mixed, default: {} },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Company = mongoose.model<ICompany>('Company', companySchema);
