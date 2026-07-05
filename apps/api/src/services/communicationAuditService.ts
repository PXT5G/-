import { Types } from 'mongoose';
import { CommunicationAuditLog } from '../database/models/CommunicationAuditLog';
import { logAudit } from './auditService';

export async function logCommunicationAudit(params: {
  userId: string;
  actorId: string;
  appId: string;
  action: string;
  resource: string;
  resourceId?: string;
  conversationId?: string;
  messageId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  await CommunicationAuditLog.create({
    userId: new Types.ObjectId(params.userId),
    actorId: new Types.ObjectId(params.actorId),
    appId: params.appId,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    conversationId: params.conversationId,
    messageId: params.messageId,
    metadata: params.metadata ?? {},
    ipAddress: params.ipAddress,
  });

  await logAudit({
    userId: params.userId,
    actorId: params.actorId,
    action: params.action,
    resource: `communication.${params.resource}`,
    resourceId: params.resourceId ?? params.messageId ?? params.conversationId,
    metadata: { appId: params.appId, ...params.metadata },
    ipAddress: params.ipAddress,
  });
}
