import { Request, Response, NextFunction } from 'express';
import * as healthService from '../../services/healthService';
import * as serviceRegistry from '../../services/serviceRegistryService';

function actorServiceId(req: Request): string {
  const body = req.body as { serviceId?: string };
  return body.serviceId ?? 'external-service';
}

export async function getHealth(_req: Request, res: Response, next: NextFunction) {
  try {
    const report = await healthService.collectSystemHealth();
    const statusCode = report.status === 'down' ? 503 : 200;
    res.status(statusCode).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

export async function postHeartbeat(req: Request, res: Response, next: NextFunction) {
  try {
    const { serviceId, status, version, metadata } = req.body as {
      serviceId: string;
      status?: 'healthy' | 'degraded' | 'down';
      version?: string;
      metadata?: Record<string, unknown>;
    };
    if (!serviceId || typeof serviceId !== 'string') {
      res.status(400).json({ success: false, error: 'serviceId is required' });
      return;
    }
    const heartbeat = serviceRegistry.recordServiceHeartbeat({
      serviceId,
      status,
      version,
      metadata,
    });
    res.json({ success: true, data: heartbeat });
  } catch (err) {
    next(err);
  }
}

export async function getServices(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: serviceRegistry.getServiceHeartbeats() });
  } catch (err) {
    next(err);
  }
}

export { actorServiceId };
