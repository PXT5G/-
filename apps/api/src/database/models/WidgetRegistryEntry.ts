import mongoose, { Schema, Document } from 'mongoose';
import type { WidgetType, WidgetSize } from '../../constants/premiumExperience';

export interface IWidgetRegistryEntry extends Document {
  widgetId: string;
  type: WidgetType;
  appId: string;
  name: string;
  description: string;
  sizes: WidgetSize[];
  defaultSize: WidgetSize;
  interactive: boolean;
  live: boolean;
  animated: boolean;
  refreshIntervalSec: number;
  icon: string;
  enabled: boolean;
}

const widgetRegistryEntrySchema = new Schema<IWidgetRegistryEntry>(
  {
    widgetId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, index: true },
    appId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    sizes: { type: [String], default: ['small', 'medium'] },
    defaultSize: { type: String, enum: ['small', 'medium', 'large'], default: 'small' },
    interactive: { type: Boolean, default: false },
    live: { type: Boolean, default: true },
    animated: { type: Boolean, default: true },
    refreshIntervalSec: { type: Number, default: 60 },
    icon: { type: String, default: '📱' },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const WidgetRegistryEntry = mongoose.model<IWidgetRegistryEntry>(
  'WidgetRegistryEntry',
  widgetRegistryEntrySchema
);
