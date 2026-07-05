import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ClockStyle } from '../../constants/phoneOs';
import { auditSchemaFields } from '../baseSchema';

export interface ILockScreenConfig extends Document {
  userId: Types.ObjectId;
  clockStyle: ClockStyle;
  wallpaperBlur: boolean;
  showWidgets: boolean;
  showNotifications: boolean;
  showMusicPlayer: boolean;
  showChargingIndicator: boolean;
  emergencyCallEnabled: boolean;
  cameraShortcutEnabled: boolean;
  flashlightShortcutEnabled: boolean;
  faceUnlockEnabled: boolean;
  fingerprintEnabled: boolean;
  pinEnabled: boolean;
  passcodeEnabled: boolean;
  autoLockSeconds: number;
  raiseToWake: boolean;
  doubleTapToWake: boolean;
  alwaysOnDisplay: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const lockScreenConfigSchema = new Schema<ILockScreenConfig>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    clockStyle: { type: String, enum: ['digital', 'analog', 'minimal', 'bold'], default: 'digital' },
    wallpaperBlur: { type: Boolean, default: true },
    showWidgets: { type: Boolean, default: true },
    showNotifications: { type: Boolean, default: true },
    showMusicPlayer: { type: Boolean, default: true },
    showChargingIndicator: { type: Boolean, default: true },
    emergencyCallEnabled: { type: Boolean, default: true },
    cameraShortcutEnabled: { type: Boolean, default: true },
    flashlightShortcutEnabled: { type: Boolean, default: true },
    faceUnlockEnabled: { type: Boolean, default: true },
    fingerprintEnabled: { type: Boolean, default: true },
    pinEnabled: { type: Boolean, default: true },
    passcodeEnabled: { type: Boolean, default: false },
    autoLockSeconds: { type: Number, default: 60 },
    raiseToWake: { type: Boolean, default: true },
    doubleTapToWake: { type: Boolean, default: true },
    alwaysOnDisplay: { type: Boolean, default: false },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const LockScreenConfig = mongoose.model<ILockScreenConfig>('LockScreenConfig', lockScreenConfigSchema);
