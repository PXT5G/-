import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IEmsMedicalRecord extends Document {
  recordId: string;
  patientId: string;
  patientName: string;
  patientUserId?: Types.ObjectId;
  dispatchId?: string;
  vitals: {
    at: Date;
    heartRate?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    temperature?: number;
    glucose?: number;
    recordedByBadge: string;
  }[];
  diagnoses: { code: string; description: string; at: Date; diagnosedByBadge: string }[];
  injuries: { description: string; severity: string; bodyPart: string; at: Date }[];
  operations: { name: string; surgeonBadge?: string; at: Date; notes?: string }[];
  labResults: { testName: string; result: string; unit?: string; normalRange?: string; at: Date }[];
  attachments: { title: string; type: string; fileUrl?: string; at: Date }[];
  history: { at: Date; event: string; badgeNumber?: string }[];
  chiefComplaint?: string;
  notes?: string;
  createdByBadge: string;
  signatureHash?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const emsMedicalRecordSchema = new Schema<IEmsMedicalRecord>(
  {
    recordId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    patientUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    dispatchId: { type: String, index: true },
    vitals: [{
      at: { type: Date, required: true },
      heartRate: { type: Number },
      bloodPressureSystolic: { type: Number },
      bloodPressureDiastolic: { type: Number },
      respiratoryRate: { type: Number },
      oxygenSaturation: { type: Number },
      temperature: { type: Number },
      glucose: { type: Number },
      recordedByBadge: { type: String },
    }],
    diagnoses: [{
      code: { type: String },
      description: { type: String },
      at: { type: Date },
      diagnosedByBadge: { type: String },
    }],
    injuries: [{
      description: { type: String },
      severity: { type: String },
      bodyPart: { type: String },
      at: { type: Date },
    }],
    operations: [{
      name: { type: String },
      surgeonBadge: { type: String },
      at: { type: Date },
      notes: { type: String },
    }],
    labResults: [{
      testName: { type: String },
      result: { type: String },
      unit: { type: String },
      normalRange: { type: String },
      at: { type: Date },
    }],
    attachments: [{
      title: { type: String },
      type: { type: String },
      fileUrl: { type: String },
      at: { type: Date },
    }],
    history: [{
      at: { type: Date, required: true },
      event: { type: String, required: true },
      badgeNumber: { type: String },
    }],
    chiefComplaint: { type: String },
    notes: { type: String },
    createdByBadge: { type: String, required: true },
    signatureHash: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsMedicalRecord = mongoose.model<IEmsMedicalRecord>('EmsMedicalRecord', emsMedicalRecordSchema);
