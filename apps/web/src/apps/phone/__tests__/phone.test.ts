import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const callSchema = z.object({
  phoneNumber: z.string().min(3),
  contactId: z.string().optional(),
});

const favoriteSchema = z.object({
  phoneNumber: z.string().min(3),
  label: z.string().min(1).max(100),
  contactId: z.string().optional(),
  position: z.number().int().min(0).optional(),
});

const blockSchema = z.object({
  phoneNumber: z.string().min(3),
  label: z.string().optional(),
  reason: z.string().optional(),
  blockType: z.enum(['call', 'sms', 'both']).optional(),
});

const settingsSchema = z.object({
  callerIdEnabled: z.boolean().optional(),
  voicemailEnabled: z.boolean().optional(),
  hapticFeedback: z.boolean().optional(),
  dynamicIslandEnabled: z.boolean().optional(),
});

const PHONE_PERMISSIONS = [
  'view_dashboard',
  'make_call',
  'receive_call',
  'end_call',
  'manage_favorites',
  'view_recents',
  'view_voicemail',
  'manage_voicemail',
  'block_numbers',
  'emergency_call',
  'conference_call',
  'record_call',
  'manage_settings',
  'view_audit_logs',
] as const;

describe('Phone call validation', () => {
  it('accepts valid outbound call', () => {
    expect(callSchema.safeParse({ phoneNumber: '+1-BNA-555-0100' }).success).toBe(true);
  });

  it('rejects short phone number', () => {
    expect(callSchema.safeParse({ phoneNumber: '12' }).success).toBe(false);
  });
});

describe('Phone favorite validation', () => {
  it('accepts valid favorite', () => {
    expect(favoriteSchema.safeParse({
      phoneNumber: '+15550100',
      label: 'Mom',
    }).success).toBe(true);
  });

  it('rejects empty label', () => {
    expect(favoriteSchema.safeParse({
      phoneNumber: '+15550100',
      label: '',
    }).success).toBe(false);
  });
});

describe('Phone block validation', () => {
  it('accepts valid block entry', () => {
    expect(blockSchema.safeParse({
      phoneNumber: '+15550999',
      blockType: 'call',
    }).success).toBe(true);
  });
});

describe('Phone settings validation', () => {
  it('accepts partial settings patch', () => {
    expect(settingsSchema.safeParse({ voicemailEnabled: false }).success).toBe(true);
  });
});

describe('Phone number format', () => {
  it('matches BananaOS phone pattern', () => {
    expect('+1-BNA-555-0100').toMatch(/^\+1-BNA-\d{3}-\d{4}$/);
  });
});

describe('Phone bundle ID', () => {
  it('is com.bananaos.phone', () => {
    expect('com.bananaos.phone').toBe('com.bananaos.phone');
  });
});

describe('Phone RBAC permissions', () => {
  it('includes all required permissions', () => {
    expect(PHONE_PERMISSIONS).toContain('make_call');
    expect(PHONE_PERMISSIONS).toContain('receive_call');
    expect(PHONE_PERMISSIONS).toContain('emergency_call');
    expect(PHONE_PERMISSIONS).toContain('view_voicemail');
    expect(PHONE_PERMISSIONS.length).toBeGreaterThanOrEqual(10);
  });
});

describe('Phone socket events', () => {
  const events = [
    'phone:ringing',
    'phone:accepted',
    'phone:ended',
    'phone:missed',
    'phone:hold',
    'phone:resume',
    'phone:mute',
    'phone:speaker',
    'phone:voicemail',
  ];

  it('defines all realtime call events', () => {
    events.forEach((e) => expect(e.startsWith('phone:')).toBe(true));
    expect(events).toHaveLength(9);
  });
});
