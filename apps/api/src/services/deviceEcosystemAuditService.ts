import { Types } from 'mongoose';
import { DeviceEcosystemAuditLog } from '../database/models/DeviceEcosystemAuditLog';
import { logAudit } from './auditService';

export async function logDeviceEcosystemAudit(params: {
  userId: string;
  actorId: string;
  action: string;
  subsystem: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await DeviceEcosystemAuditLog.create({
    userId: new Types.ObjectId(params.userId),
    actorId: new Types.ObjectId(params.actorId),
    action: params.action,
    subsystem: params.subsystem,
    resourceId: params.resourceId,
    metadata: params.metadata ?? {},
  });
  await logAudit({
    userId: params.userId,
    actorId: params.actorId,
    action: params.action,
    resource: `device.${params.subsystem}`,
    resourceId: params.resourceId,
    metadata: params.metadata,
  });
}
