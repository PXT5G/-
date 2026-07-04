import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IInvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  inventoryId?: string;
}

export interface ICompanyInvoice extends Document {
  invoiceId: string;
  companyId: string;
  invoiceNumber: string;
  type: 'sale' | 'purchase' | 'service';
  customerId?: string;
  supplierId?: string;
  lineItems: IInvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'voided';
  dueDate?: Date;
  paidAt?: Date;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const lineItemSchema = new Schema<IInvoiceLineItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    inventoryId: { type: String },
  },
  { _id: false }
);

const companyInvoiceSchema = new Schema<ICompanyInvoice>(
  {
    invoiceId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    invoiceNumber: { type: String, required: true },
    type: { type: String, enum: ['sale', 'purchase', 'service'], required: true },
    customerId: { type: String, index: true },
    supplierId: { type: String, index: true },
    lineItems: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'voided'],
      default: 'draft',
      index: true,
    },
    dueDate: { type: Date },
    paidAt: { type: Date },
    notes: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

companyInvoiceSchema.index({ companyId: 1, invoiceNumber: 1 }, { unique: true });

export const CompanyInvoice = mongoose.model<ICompanyInvoice>('CompanyInvoice', companyInvoiceSchema);
