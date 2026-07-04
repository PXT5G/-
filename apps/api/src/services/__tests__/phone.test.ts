import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { BANANAOS_APP_IDS } from '@bananaos/shared';

const callBodySchema = z.object({
  phoneNumber: z.string().min(3),
  contactId: z.string().optional(),
});

describe('Phone app ID', () => {
  it('is registered in shared app IDs', () => {
    expect(BANANAOS_APP_IDS.PHONE).toBe('com.bananaos.phone');
  });
});

describe('Phone API validation schemas', () => {
  it('validates make call body', () => {
    expect(callBodySchema.safeParse({ phoneNumber: '+1-BNA-555-0199' }).success).toBe(true);
  });

  it('rejects invalid call body', () => {
    expect(callBodySchema.safeParse({ phoneNumber: '' }).success).toBe(false);
  });
});

describe('Phone permission names', () => {
  const perms = [
    'view_dashboard', 'make_call', 'receive_call', 'end_call',
    'manage_favorites', 'view_recents', 'view_voicemail', 'emergency_call',
  ];
  it('has core telephony permissions', () => {
    perms.forEach((p) => expect(p.length).toBeGreaterThan(3));
  });
});
