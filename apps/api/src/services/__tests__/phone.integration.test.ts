import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCallId, userId, mockCall, ctx } = vi.hoisted(() => {
  const id = '507f1f77bcf86cd799439011';
  const uid = '507f1f77bcf86cd799439012';
  const call = {
    _id: id,
    userId: uid,
    phoneNumber: '+1-BNA-555-0199',
    remoteNumber: '+1-BNA-555-0100',
    direction: 'outgoing',
    status: 'ringing',
    isEmergency: false,
    isMuted: false,
    isSpeaker: false,
    isOnHold: false,
    startedAt: new Date(),
    createdAt: new Date(),
    save: vi.fn().mockResolvedValue(true),
  };
  return {
    mockCallId: id,
    userId: uid,
    mockCall: call,
    ctx: {
      performedBy: uid,
      performedByRole: 'user',
      permission: 'make_call' as const,
    },
  };
});

vi.mock('../../platform', () => ({
  auditService: { log: vi.fn().mockResolvedValue(undefined) },
  eventBusService: { emitToUser: vi.fn() },
  notificationService: { send: vi.fn().mockResolvedValue(undefined) },
  permissionEngineService: {
    hasPermission: vi.fn().mockResolvedValue({ granted: true, source: 'core' }),
    grantPermissions: vi.fn().mockResolvedValue(undefined),
  },
  BANANAOS_APP_IDS: { PHONE: 'com.bananaos.phone' },
}));

vi.mock('../../database/models/PhoneAuditLog', () => ({
  PhoneAuditLog: { create: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../../database/models/PhoneCallSettings', () => ({
  PhoneCallSettings: {
    findOne: vi.fn().mockResolvedValue({
      callerIdEnabled: true,
      voicemailEnabled: true,
      save: vi.fn(),
    }),
    create: vi.fn(),
  },
}));

vi.mock('../../database/models/Identity', () => ({
  Identity: { findOne: vi.fn().mockResolvedValue({ verified: true }) },
}));

vi.mock('../../database/models/SIMProfile', () => ({
  SIMProfile: { findOne: vi.fn().mockResolvedValue({ status: 'active', isPrimary: true }) },
}));

vi.mock('../../database/models/PhoneNumber', () => ({
  PhoneNumber: {
    findById: vi.fn().mockResolvedValue({ number: '+1-BNA-555-0199' }),
    findOne: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../../database/models/PhonePermission', () => ({
  PhonePermission: { countDocuments: vi.fn().mockResolvedValue(1) },
  USER_DEFAULT_PERMISSIONS: [
    'view_dashboard', 'make_call', 'receive_call', 'end_call', 'manage_favorites',
    'view_recents', 'view_voicemail', 'manage_voicemail', 'block_numbers', 'emergency_call', 'manage_settings',
  ],
  ADMIN_PERMISSIONS: [
    'view_dashboard', 'make_call', 'receive_call', 'end_call', 'manage_favorites',
    'view_recents', 'view_voicemail', 'manage_voicemail', 'block_numbers', 'emergency_call', 'manage_settings',
    'conference_call', 'record_call', 'view_audit_logs',
  ],
}));

vi.mock('../../database/models/Call', () => ({
  Call: {
    create: vi.fn().mockImplementation((data) => Promise.resolve({ ...mockCall, ...data })),
    findOne: vi.fn().mockResolvedValue(mockCall),
  },
}));

vi.mock('../../database/models/ActiveCall', () => ({
  ActiveCall: {
    create: vi.fn().mockResolvedValue({
      _id: 'ac1',
      callId: mockCallId,
      startedAt: new Date(),
      displayName: 'Test',
      remoteNumber: '+1-BNA-555-0100',
      phoneNumber: '+1-BNA-555-0199',
      direction: 'outgoing',
      state: 'ringing',
      isEmergency: false,
      isMuted: false,
      isSpeaker: false,
      isOnHold: false,
      isConference: false,
    }),
    findOne: vi.fn().mockResolvedValue(null),
    findOneAndUpdate: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock('../../database/models/CallHistory', () => ({
  CallHistory: { create: vi.fn(), find: vi.fn(), countDocuments: vi.fn().mockResolvedValue(0) },
}));

vi.mock('../../database/models/Contact', () => ({
  Contact: { findOne: vi.fn().mockResolvedValue(null) },
}));

vi.mock('../../database/models/PhoneBlockedNumber', () => ({
  PhoneBlockedNumber: { findOne: vi.fn().mockResolvedValue(null) },
}));

import { USER_DEFAULT_PERMISSIONS, ADMIN_PERMISSIONS } from '../../database/models/PhonePermission';
import { initPhone, hasPermission } from '../phoneService';
import { makeCall, acceptCall, endCall } from '../callService';
import { placeEmergencyCall } from '../emergencyService';
import { permissionEngineService } from '../../platform';

describe('Phone call lifecycle integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCall.status = 'ringing';
    vi.mocked(permissionEngineService.hasPermission).mockResolvedValue({ granted: true, source: 'core' });
  });

  it('initializes phone for verified identity + active SIM', async () => {
    const result = await initPhone(userId, { ...ctx, permission: 'view_dashboard' });
    expect(result.initialized).toBe(true);
  });

  it('places outbound call and returns active call', async () => {
    const result = await makeCall(userId, { phoneNumber: '+1-BNA-555-0100' }, ctx);
    expect(result.call).toBeDefined();
    expect(result.activeCall).toBeDefined();
    expect(result.call.status).toBe('ringing');
  });

  it('accepts ringing call', async () => {
    const accepted = await acceptCall(userId, mockCallId, { ...ctx, permission: 'receive_call' });
    expect(accepted.status).toBe('active');
    expect(mockCall.save).toHaveBeenCalled();
  });

  it('ends active call', async () => {
    mockCall.status = 'active';
    const ended = await endCall(userId, mockCallId, { ...ctx, permission: 'end_call' });
    expect(ended.status).toBe('ended');
  });
});

describe('Phone RBAC integration', () => {
  it('grants default user permissions', () => {
    expect(USER_DEFAULT_PERMISSIONS).toContain('make_call');
    expect(USER_DEFAULT_PERMISSIONS).toContain('receive_call');
    expect(USER_DEFAULT_PERMISSIONS).toContain('emergency_call');
    expect(USER_DEFAULT_PERMISSIONS).not.toContain('view_audit_logs');
  });

  it('extends admin permissions', () => {
    expect(ADMIN_PERMISSIONS).toContain('conference_call');
    expect(ADMIN_PERMISSIONS).toContain('record_call');
    expect(ADMIN_PERMISSIONS).toContain('view_audit_logs');
  });

  it('denies permission when engine rejects', async () => {
    vi.mocked(permissionEngineService.hasPermission).mockResolvedValueOnce({ granted: false, source: 'denied' });
    const allowed = await hasPermission(userId, 'make_call', 'user');
    expect(allowed).toBe(false);
  });
});

describe('Emergency call integration', () => {
  it('places emergency call via makeCall', async () => {
    const result = await placeEmergencyCall(userId, { ...ctx, permission: 'emergency_call' });
    expect(result.call).toBeDefined();
    expect(result.activeCall).toBeDefined();
  });
});

describe('Identity verification gate', () => {
  it('requires verified identity for init', async () => {
    const { Identity } = await import('../../database/models/Identity');
    vi.mocked(Identity.findOne).mockResolvedValueOnce(null);
    await expect(initPhone(userId, { ...ctx, permission: 'view_dashboard' })).rejects.toThrow('Verified identity required');
  });
});

describe('SIM activation gate', () => {
  it('requires active SIM for outbound calls', async () => {
    const { SIMProfile } = await import('../../database/models/SIMProfile');
    vi.mocked(SIMProfile.findOne).mockResolvedValueOnce(null);
    await expect(makeCall(userId, { phoneNumber: '+1-BNA-555-0100' }, ctx)).rejects.toThrow('Active SIM required');
  });
});
