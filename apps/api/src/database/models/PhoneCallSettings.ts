import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPhoneCallSettings extends Document {
  userId: Types.ObjectId;
  callerIdEnabled: boolean;
  showMyNumber: boolean;
  autoRejectUnknown: boolean;
  silenceUnknownCallers: boolean;
  callWaiting: boolean;
  callForwardingEnabled: boolean;
  callForwardingNumber?: string;
  voicemailEnabled: boolean;
  voicemailGreeting?: string;
  recordCalls: boolean;
  hapticFeedback: boolean;
  dynamicIslandEnabled: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<IPhoneCallSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    callerIdEnabled: { type: Boolean, default: true },
    showMyNumber: { type: Boolean, default: true },
    autoRejectUnknown: { type: Boolean, default: false },
    silenceUnknownCallers: { type: Boolean, default: false },
    callWaiting: { type: Boolean, default: true },
    callForwardingEnabled: { type: Boolean, default: false },
    callForwardingNumber: { type: String },
    voicemailEnabled: { type: Boolean, default: true },
    voicemailGreeting: { type: String },
    recordCalls: { type: Boolean, default: false },
    hapticFeedback: { type: Boolean, default: true },
    dynamicIslandEnabled: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'phone_call_settings' }
);

export const PhoneCallSettings = mongoose.model<IPhoneCallSettings>('PhoneCallSettings', settingsSchema);
