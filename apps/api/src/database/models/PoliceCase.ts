import mongoose, { Schema, Document, Types } from 'mongoose';

export type CaseStatus = 'open' | 'assigned' | 'investigating' | 'closed' | 'archived';

export interface IPoliceCase extends Document {
  caseNumber: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: 1 | 2 | 3;
  assignedOfficerIds: Types.ObjectId[];
  leadOfficerId?: Types.ObjectId;
  involvedParties: string[];
  location?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const policeCaseSchema = new Schema<IPoliceCase>(
  {
    caseNumber: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['open', 'assigned', 'investigating', 'closed', 'archived'], default: 'open', index: true },
    priority: { type: Number, enum: [1, 2, 3], default: 2 },
    assignedOfficerIds: [{ type: Schema.Types.ObjectId, ref: 'PoliceOfficer' }],
    leadOfficerId: { type: Schema.Types.ObjectId, ref: 'PoliceOfficer' },
    involvedParties: [{ type: String }],
    location: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

export const PoliceCase = mongoose.model<IPoliceCase>('PoliceCase', policeCaseSchema);

export function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(10000 + Math.random() * 90000);
  return `CASE-${year}-${seq}`;
}
