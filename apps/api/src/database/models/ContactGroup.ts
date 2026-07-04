import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IContactGroup extends Document {
  userId: Types.ObjectId;
  name: string;
  color?: string;
  icon?: string;
  contactIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const contactGroupSchema = new Schema<IContactGroup>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#FFD700' },
    icon: { type: String, default: '👥' },
    contactIds: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
  },
  { timestamps: true }
);

contactGroupSchema.index({ userId: 1, name: 1 });

export const ContactGroup = mongoose.model<IContactGroup>('ContactGroup', contactGroupSchema);
