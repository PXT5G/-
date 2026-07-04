import { Types } from 'mongoose';
import { logAudit } from './auditService';

export async function logSystemAppAudit(params: {
  userId: string;
  actorId: string;
  appId: string;
  action: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await logAudit({
    userId: params.userId,
    actorId: params.actorId,
    action: params.action,
    resource: `system_app.${params.appId}`,
    resourceId: params.resourceId,
    metadata: params.metadata,
  });
}
