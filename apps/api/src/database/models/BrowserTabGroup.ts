import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBrowserTabGroup extends Document {
  groupId: string;
  userId: Types.ObjectId;
  sessionId: string;
  name: string;
  color: string;
  collapsed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const browserTabGroupSchema = new Schema<IBrowserTabGroup>(
  {
    groupId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    color: { type: String, default: '#DC2626' },
    collapsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const BrowserTabGroup = mongoose.model<IBrowserTabGroup>('BrowserTabGroup', browserTabGroupSchema);
