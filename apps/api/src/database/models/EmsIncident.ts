import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { IncidentStatus } from '../../constants/ems';

export interface IEmsIncident extends Document {
  incidentId: string;
  title: string;
  description: string;
  type: 'mass_casualty' | 'multi_vehicle' | 'disaster' | 'active_shooter' | 'hazmat' | 'other';
  status: IncidentStatus;
  location: string;
  district: string;
  latitude?: number;
  longitude?: number;
  patientCount: number;
  criticalCount: number;
  assignedUnitIds: string[];
  assignedDispatchIds: string[];
  policeDispatchId?: string;
  helicopterDispatched: boolean;
  commanderBadge?: string;
  timeline: { at: Date; event: string; badgeNumber?: string }[];
  resolvedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const emsIncidentSchema = new Schema<IEmsIncident>(
  {
    incidentId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['mass_casualty', 'multi_vehicle', 'disaster', 'active_shooter', 'hazmat', 'other'], required: true },
    status: { type: String, enum: ['active', 'contained', 'resolved'], default: 'active', index: true },
    location: { type: String, required: true },
    district: { type: String, required: true, index: true },
    latitude: { type: Number },
    longitude: { type: Number },
    patientCount: { type: Number, default: 0 },
    criticalCount: { type: Number, default: 0 },
    assignedUnitIds: { type: [String], default: [] },
    assignedDispatchIds: { type: [String], default: [] },
    policeDispatchId: { type: String, index: true },
    helicopterDispatched: { type: Boolean, default: false },
    commanderBadge: { type: String },
    timeline: [{
      at: { type: Date, required: true },
      event: { type: String, required: true },
      badgeNumber: { type: String },
    }],
    resolvedAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsIncident = mongoose.model<IEmsIncident>('EmsIncident', emsIncidentSchema);
