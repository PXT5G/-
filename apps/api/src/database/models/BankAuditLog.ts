import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBankAuditLog extends Document {
  userId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId;
  details?: string;
  amount?: number;
  performedBy: Types.ObjectId;
  performedByRole: string;
  ipAddress?: string;
  createdAt: Date;
}

const bankAuditLogSchema = new Schema<IBankAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    details: { type: String },
    amount: { type: Number },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedByRole: { type: String, default: 'user' },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const BankAuditLog = mongoose.model<IBankAuditLog>('BankAuditLog', bankAuditLogSchema);
