import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISMSSettings extends Document {
  userId: Types.ObjectId;
  messageCenter: string;
  deliveryReports: boolean;
  readReports: boolean;
  spamFilter: boolean;
  backupEnabled: boolean;
  lastBackupAt?: Date;
}

const smsSettingsSchema = new Schema<ISMSSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    messageCenter: { type: String, default: '+1-BNA-SMS-CENTER' },
    deliveryReports: { type: Boolean, default: true },
    readReports: { type: Boolean, default: true },
    spamFilter: { type: Boolean, default: true },
    backupEnabled: { type: Boolean, default: false },
    lastBackupAt: { type: Date },
  },
  { timestamps: true }
);

export const SMSSettings = mongoose.model<ISMSSettings>('SMSSettings', smsSettingsSchema);
