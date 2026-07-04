import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IIdentityHistory extends Document {
  identityId: Types.ObjectId;
  userId: Types.ObjectId;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  performedBy: Types.ObjectId;
  performedByRole: string;
  createdAt: Date;
}

const identityHistorySchema = new Schema<IIdentityHistory>(
  {
    identityId: { type: Schema.Types.ObjectId, ref: 'Identity', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true },
    field: { type: String },
    oldValue: { type: String },
    newValue: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedByRole: { type: String, default: 'user' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const IdentityHistory = mongoose.model<IIdentityHistory>('IdentityHistory', identityHistorySchema);
