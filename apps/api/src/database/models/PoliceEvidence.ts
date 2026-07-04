import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPoliceEvidence extends Document {
  caseId?: Types.ObjectId;
  reportId?: Types.ObjectId;
  title: string;
  description?: string;
  type: 'photo' | 'document' | 'video' | 'audio' | 'other';
  fileUrl?: string;
  hash?: string;
  collectedBy: Types.ObjectId;
  chainOfCustody: { officerId: Types.ObjectId; action: string; timestamp: Date }[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const policeEvidenceSchema = new Schema<IPoliceEvidence>(
  {
    caseId: { type: Schema.Types.ObjectId, ref: 'PoliceCase', index: true },
    reportId: { type: Schema.Types.ObjectId, ref: 'PoliceReport', index: true },
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['photo', 'document', 'video', 'audio', 'other'], default: 'document' },
    fileUrl: { type: String },
    hash: { type: String },
    collectedBy: { type: Schema.Types.ObjectId, ref: 'PoliceOfficer', required: true },
    chainOfCustody: [{
      officerId: { type: Schema.Types.ObjectId, ref: 'PoliceOfficer' },
      action: String,
      timestamp: { type: Date, default: Date.now },
    }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const PoliceEvidence = mongoose.model<IPoliceEvidence>('PoliceEvidence', policeEvidenceSchema);
