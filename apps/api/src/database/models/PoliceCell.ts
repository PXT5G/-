import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceCell extends Document {
  cellId: string;
  block: string;
  number: number;
  capacity: number;
  status: 'open' | 'maintenance';
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeCellSchema = new Schema<IPoliceCell>(
  {
    cellId: { type: String, required: true, unique: true, index: true },
    block: { type: String, required: true, index: true },
    number: { type: Number, required: true },
    capacity: { type: Number, default: 2 },
    status: { type: String, enum: ['open', 'maintenance'], default: 'open' },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceCell = mongoose.model<IPoliceCell>('PoliceCell', policeCellSchema);
