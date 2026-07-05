import mongoose, { Schema, Document, Types } from 'mongoose';
import { DEFAULT_CONTROL_CENTER_TILES } from '../../constants/phoneOs';
import { auditSchemaFields } from '../baseSchema';

export interface IControlCenterConfig extends Document {
  userId: Types.ObjectId;
  tiles: string[];
  longPressActions: Record<string, string>;
  showBatteryWidget: boolean;
  showNetworkDetails: boolean;
  showMusicControls: boolean;
  showMediaOutput: boolean;
  brightnessEnabled: boolean;
  volumeEnabled: boolean;
  focusModeEnabled: boolean;
  activeFocusMode: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const controlCenterConfigSchema = new Schema<IControlCenterConfig>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    tiles: { type: [String], default: () => [...DEFAULT_CONTROL_CENTER_TILES] },
    longPressActions: { type: Schema.Types.Mixed, default: {} },
    showBatteryWidget: { type: Boolean, default: true },
    showNetworkDetails: { type: Boolean, default: true },
    showMusicControls: { type: Boolean, default: true },
    showMediaOutput: { type: Boolean, default: true },
    brightnessEnabled: { type: Boolean, default: true },
    volumeEnabled: { type: Boolean, default: true },
    focusModeEnabled: { type: Boolean, default: false },
    activeFocusMode: { type: String, default: 'none' },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const ControlCenterConfig = mongoose.model<IControlCenterConfig>(
  'ControlCenterConfig',
  controlCenterConfigSchema
);
