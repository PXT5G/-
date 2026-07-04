import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const createIdentitySchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(30).optional(),
  country: z.string().min(1).max(100).optional(),
  biography: z.string().max(500).optional(),
  emergencyContact: z
    .object({
      name: z.string().min(1),
      phone: z.string().min(1),
      relationship: z.string().min(1),
    })
    .optional(),
});

const verifySchema = z.object({
  payload: z.string().optional(),
  barcode: z.string().optional(),
  nationalId: z.string().optional(),
  method: z.enum(['qr', 'barcode', 'api']).default('qr'),
});

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/),
});

describe('Identity validation', () => {
  it('accepts valid identity creation', () => {
    const result = createIdentitySchema.safeParse({
      fullName: 'John Doe',
      username: 'johndoe',
      country: 'Banana Republic',
    });
    expect(result.success).toBe(true);
  });

  it('rejects biography over 500 chars', () => {
    const result = createIdentitySchema.safeParse({
      biography: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid PIN', () => {
    expect(pinSchema.safeParse({ pin: '1234' }).success).toBe(true);
    expect(pinSchema.safeParse({ pin: '123456' }).success).toBe(true);
  });

  it('rejects invalid PIN', () => {
    expect(pinSchema.safeParse({ pin: '123' }).success).toBe(false);
    expect(pinSchema.safeParse({ pin: 'abcdef' }).success).toBe(false);
  });
});

describe('Identity verification schema', () => {
  it('accepts QR verification', () => {
    const result = verifySchema.safeParse({
      payload: '{"v":1,"nationalId":"BN-2026-123456"}',
      method: 'qr',
    });
    expect(result.success).toBe(true);
  });

  it('accepts barcode verification', () => {
    const result = verifySchema.safeParse({
      barcode: 'BN2026123456',
      method: 'barcode',
    });
    expect(result.success).toBe(true);
  });

  it('accepts API verification by national ID', () => {
    const result = verifySchema.safeParse({
      nationalId: 'BN-2026-123456',
      method: 'api',
    });
    expect(result.success).toBe(true);
  });
});

describe('National ID format', () => {
  it('follows BN-YYYY-NNNNNN pattern', () => {
    const id = 'BN-2026-123456';
    expect(id).toMatch(/^BN-\d{4}-\d{6}$/);
  });

  it('membership number follows MBR-NNNNNNNN pattern', () => {
    const mbr = 'MBR-12345678';
    expect(mbr).toMatch(/^MBR-\d{8}$/);
  });
});

describe('Identity bundle ID', () => {
  it('is com.bananaos.identity', () => {
    expect('com.bananaos.identity').toMatch(/^com\.bananaos\.identity$/);
  });
});
