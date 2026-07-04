import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IAccessibilityConfig extends Document {
  userId: Types.ObjectId;
  voiceOverEnabled: boolean;
  largeText: boolean;
  boldText: boolean;
  reduceMotion: boolean;
  reduceTransparency: boolean;
  monoAudio: boolean;
  captionsEnabled: boolean;
  colorFiltersEnabled: boolean;
  colorFilterType: string;
  touchAssistEnabled: boolean;
  hearingAidEnabled: boolean;
  fontScale: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const accessibilityConfigSchema = new Schema<IAccessibilityConfig>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    voiceOverEnabled: { type: Boolean, default: false },
    largeText: { type: Boolean, default: false },
    boldText: { type: Boolean, default: false },
    reduceMotion: { type: Boolean, default: false },
    reduceTransparency: { type: Boolean, default: false },
    monoAudio: { type: Boolean, default: false },
    captionsEnabled: { type: Boolean, default: false },
    colorFiltersEnabled: { type: Boolean, default: false },
    colorFilterType: { type: String, default: 'none' },
    touchAssistEnabled: { type: Boolean, default: false },
    hearingAidEnabled: { type: Boolean, default: false },
    fontScale: { type: Number, default: 1 },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const AccessibilityConfig = mongoose.model<IAccessibilityConfig>(
  'AccessibilityConfig',
  accessibilityConfigSchema
);
