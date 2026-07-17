import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAircraftAuditLog extends Document {
  logId: string;
  aircraftId?: string;
  dealerId?: string;
  airportId?: string;
  userId: Types.ObjectId;
  actorId: Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  deviceUuid?: string;
  signatureHash?: string;
}

const aircraftAuditLogSchema = new Schema<IAircraftAuditLog>(
  {
    logId: { type: String, required: true, unique: true, index: true },
    aircraftId: { type: String, index: true },
    dealerId: { type: String, index: true },
    airportId: { type: String, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    deviceUuid: { type: String },
    signatureHash: { type: String },
  },
  { timestamps: true }
);

export const AircraftAuditLog = mongoose.model<IAircraftAuditLog>('AircraftAuditLog', aircraftAuditLogSchema);
