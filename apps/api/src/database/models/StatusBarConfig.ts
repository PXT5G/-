import mongoose, { Schema, Document, Types } from 'mongoose';
import { DEFAULT_STATUS_BAR_ICONS } from '../../constants/phoneOs';
import { auditSchemaFields } from '../baseSchema';

export interface IStatusBarConfig extends Document {
  userId: Types.ObjectId;
  visibleIcons: string[];
  showCarrier: boolean;
  showClock: boolean;
  showBatteryPercent: boolean;
  showVpn: boolean;
  showDnd: boolean;
  showAlarm: boolean;
  showGps: boolean;
  showHotspot: boolean;
  showEmergency: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const statusBarConfigSchema = new Schema<IStatusBarConfig>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    visibleIcons: { type: [String], default: () => [...DEFAULT_STATUS_BAR_ICONS] },
    showCarrier: { type: Boolean, default: true },
    showClock: { type: Boolean, default: true },
    showBatteryPercent: { type: Boolean, default: true },
    showVpn: { type: Boolean, default: true },
    showDnd: { type: Boolean, default: true },
    showAlarm: { type: Boolean, default: true },
    showGps: { type: Boolean, default: true },
    showHotspot: { type: Boolean, default: true },
    showEmergency: { type: Boolean, default: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const StatusBarConfig = mongoose.model<IStatusBarConfig>('StatusBarConfig', statusBarConfigSchema);
