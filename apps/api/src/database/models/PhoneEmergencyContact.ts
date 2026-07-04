import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPhoneEmergencyContact extends Document {
  userId: Types.ObjectId;
  contactId?: Types.ObjectId;
  name: string;
  phoneNumber: string;
  relationship: string;
  priority: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const emergencySchema = new Schema<IPhoneEmergencyContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    relationship: { type: String, default: 'Emergency' },
    priority: { type: Number, default: 1, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'phone_emergency_contacts' }
);

emergencySchema.index({ userId: 1, priority: 1 });

export const PhoneEmergencyContact = mongoose.model<IPhoneEmergencyContact>('PhoneEmergencyContact', emergencySchema);
