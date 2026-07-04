import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICommunicationAuditLog extends Document {
  userId: Types.ObjectId;
  actorId: Types.ObjectId;
  appId: string;
  action: string;
  resource: string;
  resourceId?: string;
  conversationId?: string;
  messageId?: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const communicationAuditLogSchema = new Schema<ICommunicationAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true },
    resourceId: { type: String, index: true },
    conversationId: { type: String, index: true },
    messageId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

communicationAuditLogSchema.index({ createdAt: -1 });
communicationAuditLogSchema.index({ conversationId: 1, createdAt: -1 });

export const CommunicationAuditLog = mongoose.model<ICommunicationAuditLog>(
  'CommunicationAuditLog',
  communicationAuditLogSchema
);
