import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IWidgetInstance {
  id: string;
  type: string;
  bundleId?: string;
  pageIndex: number;
  row: number;
  col: number;
  size: 'small' | 'medium' | 'large';
  config: Record<string, unknown>;
  live: boolean;
  interactive: boolean;
}

export interface IWidgetLayout extends Document {
  userId: Types.ObjectId;
  pages: { index: number; widgets: IWidgetInstance[] }[];
  dockApps: string[];
  hiddenApps: string[];
  gridColumns: number;
  gridRows: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const widgetInstanceSchema = new Schema<IWidgetInstance>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    bundleId: { type: String },
    pageIndex: { type: Number, default: 0 },
    row: { type: Number, default: 0 },
    col: { type: Number, default: 0 },
    size: { type: String, enum: ['small', 'medium', 'large'], default: 'small' },
    config: { type: Schema.Types.Mixed, default: {} },
    live: { type: Boolean, default: false },
    interactive: { type: Boolean, default: false },
  },
  { _id: false }
);

const widgetLayoutSchema = new Schema<IWidgetLayout>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    pages: {
      type: [
        {
          index: { type: Number, required: true },
          widgets: { type: [widgetInstanceSchema], default: [] },
        },
      ],
      default: [{ index: 0, widgets: [] }],
    },
    dockApps: { type: [String], default: [] },
    hiddenApps: { type: [String], default: [] },
    gridColumns: { type: Number, default: 4 },
    gridRows: { type: Number, default: 6 },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const WidgetLayout = mongoose.model<IWidgetLayout>('WidgetLayout', widgetLayoutSchema);
