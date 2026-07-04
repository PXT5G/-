import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICallSettings extends Document {
  userId: Types.ObjectId;
  callerIdEnabled: boolean;
  callWaiting: boolean;
  callForwarding: boolean;
  callForwardingNumber?: string;
  voicemailEnabled: boolean;
  spamProtection: boolean;
  unknownCallFilter: boolean;
  emergencyNumbers: string[];
}

const callSettingsSchema = new Schema<ICallSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    callerIdEnabled: { type: Boolean, default: true },
    callWaiting: { type: Boolean, default: true },
    callForwarding: { type: Boolean, default: false },
    callForwardingNumber: { type: String },
    voicemailEnabled: { type: Boolean, default: true },
    spamProtection: { type: Boolean, default: true },
    unknownCallFilter: { type: Boolean, default: false },
    emergencyNumbers: { type: [String], default: ['911', '112', '999'] },
  },
  { timestamps: true }
);

export const CallSettings = mongoose.model<ICallSettings>('CallSettings', callSettingsSchema);
