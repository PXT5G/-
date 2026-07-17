import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPropertyMaintenance extends Document {
  maintenanceId: string;
  propertyId: string;
  type: 'maintenance' | 'cleaning' | 'security' | 'utility' | 'renovation' | 'repair' | 'tenant_request';
  title: string;
  description: string;
  status: 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  cost: number;
  assignedTo?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  requestedBy: Types.ObjectId;
  serviceContractId?: string;
  repairHistory: { action: string; cost: number; at: Date; notes?: string }[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const propertyMaintenanceSchema = new Schema<IPropertyMaintenance>(
  {
    maintenanceId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    type: { type: String, enum: ['maintenance', 'cleaning', 'security', 'utility', 'renovation', 'repair', 'tenant_request'], required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['requested', 'scheduled', 'in_progress', 'completed', 'cancelled'], default: 'requested', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    cost: { type: Number, default: 0 },
    assignedTo: { type: String },
    scheduledAt: { type: Date },
    completedAt: { type: Date },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    serviceContractId: { type: String },
    repairHistory: { type: [{ action: String, cost: Number, at: Date, notes: String }], default: [] },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PropertyMaintenance = mongoose.model<IPropertyMaintenance>('PropertyMaintenance', propertyMaintenanceSchema);
