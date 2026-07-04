import { Identity } from '../../database/models/Identity';
import { IdentityPermission } from '../../database/models/IdentityPermission';
import { PlatformAppSession } from '../../database/models/platform/PlatformAppSession';
import { Session } from '../../database/models/Session';
import { BANANAOS_APP_IDS, IDENTITY_GATED_APPS, type IdentityContext } from '../types';
import { auditService } from './auditService';
import { eventBusService } from './eventBusService';

export async function getIdentityContext(userId: string): Promise<IdentityContext> {
  const identity = await Identity.findOne({ userId });
  if (!identity) {
    return { userId, verified: false };
  }
  return {
    userId,
    identityId: identity._id.toString(),
    fullName: identity.fullName,
    username: identity.username,
    nationalId: identity.nationalId,
    status: identity.status,
    verified: identity.verified && identity.status === 'verified',
    membershipLevel: identity.membershipLevel,
    expiryDate: identity.expiryDate.toISOString(),
  };
}

export async function assertIdentityGate(userId: string, appId: string): Promise<IdentityContext> {
  const ctx = await getIdentityContext(userId);
  if (IDENTITY_GATED_APPS.includes(appId as typeof IDENTITY_GATED_APPS[number]) && !ctx.verified) {
    throw new Error('Verified BananaOS Identity required');
  }
  return ctx;
}

export async function verifyIdentityForApp(
  userId: string,
  appId: string,
  method: 'session' | 'profile' = 'profile'
): Promise<{ allowed: boolean; context: IdentityContext; reason?: string }> {
  const context = await getIdentityContext(userId);

  if (IDENTITY_GATED_APPS.includes(appId as typeof IDENTITY_GATED_APPS[number])) {
    if (!context.verified) {
      await auditService.log({
        appId: BANANAOS_APP_IDS.IDENTITY,
        userId,
        action: 'identity_gate_denied',
        entityType: 'Identity',
        ctx: { performedBy: userId, performedByRole: 'user', permission: 'verify' },
        metadata: { requestingAppId: appId, method },
      });
      return { allowed: false, context, reason: 'Identity not verified' };
    }
  }

  await auditService.log({
    appId: BANANAOS_APP_IDS.IDENTITY,
    userId,
    action: 'identity_gate_passed',
    entityType: 'Identity',
    ctx: { performedBy: userId, performedByRole: 'user', permission: 'verify' },
    metadata: { requestingAppId: appId, method },
  });

  eventBusService.emitToUser(userId, 'identity:verified', { appId, verified: context.verified });
  return { allowed: true, context };
}

export async function linkAppSession(params: {
  userId: string;
  sessionId: string;
  appId: string;
  deviceId?: string;
  deviceName?: string;
  ipAddress?: string;
}): Promise<void> {
  const now = new Date();
  await PlatformAppSession.findOneAndUpdate(
    { userId: params.userId, sessionId: params.sessionId },
    {
      $set: {
        activeAppId: params.appId,
        deviceId: params.deviceId,
        deviceName: params.deviceName,
        ipAddress: params.ipAddress,
        lastActiveAt: now,
      },
      $push: {
        appContexts: {
          $each: [{ appId: params.appId, lastAccessedAt: now, deviceId: params.deviceId }],
          $slice: -50,
        },
      },
    },
    { upsert: true }
  );

  await Session.findOneAndUpdate(
    { userId: params.userId, refreshToken: { $exists: true } },
    { lastActiveAt: now }
  ).catch(() => undefined);
}

export async function getActiveAppSessions(userId: string) {
  const sessions = await PlatformAppSession.find({ userId }).sort({ lastActiveAt: -1 }).limit(20).lean();
  return sessions.map((s) => ({
    sessionId: s.sessionId,
    activeAppId: s.activeAppId,
    deviceId: s.deviceId,
    deviceName: s.deviceName,
    lastActiveAt: s.lastActiveAt.toISOString(),
    appContexts: s.appContexts.map((c) => ({
      appId: c.appId,
      lastAccessedAt: c.lastAccessedAt.toISOString(),
    })),
  }));
}

export async function crossAppIdentityLookup(
  requestingUserId: string,
  targetUserId: string,
  requestingAppId: string,
  permission = 'read_identity'
): Promise<IdentityContext | null> {
  const crossPerm = await IdentityPermission.findOne({
    userId: targetUserId,
    appId: requestingAppId,
    permission,
    granted: true,
  });

  if (!crossPerm && requestingUserId !== targetUserId) {
    await auditService.log({
      appId: BANANAOS_APP_IDS.IDENTITY,
      userId: targetUserId,
      action: 'cross_app_identity_denied',
      entityType: 'Identity',
      ctx: { performedBy: requestingUserId, performedByRole: 'user', permission },
      metadata: { requestingAppId },
    });
    return null;
  }

  const context = await getIdentityContext(targetUserId);
  await auditService.log({
    appId: BANANAOS_APP_IDS.IDENTITY,
    userId: targetUserId,
    action: 'cross_app_identity_lookup',
    entityType: 'Identity',
    ctx: { performedBy: requestingUserId, performedByRole: 'user', permission },
    metadata: { requestingAppId },
  });

  return context;
}

export const identityBridgeService = {
  getIdentityContext,
  assertIdentityGate,
  verifyIdentityForApp,
  linkAppSession,
  getActiveAppSessions,
  crossAppIdentityLookup,
};
