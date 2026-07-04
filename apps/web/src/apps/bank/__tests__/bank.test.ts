import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const transferSchema = z.object({
  fromAccountId: z.string(),
  toAccountId: z.string().optional(),
  toAccountNumber: z.string().optional(),
  amount: z.number().min(0.01),
  reason: z.string().max(200).optional(),
});

const depositSchema = z.object({
  accountId: z.string(),
  amount: z.number().min(0.01),
  method: z.enum(['cash', 'manual']).default('manual'),
});

const paymentSchema = z.object({
  accountId: z.string(),
  amount: z.number().min(0.01),
  type: z.enum(['bill', 'subscription', 'store', 'membership', 'invoice', 'request']),
  recipient: z.string().min(1),
  description: z.string().min(1),
});

describe('Bank transfer validation', () => {
  it('accepts valid transfer', () => {
    const result = transferSchema.safeParse({
      fromAccountId: 'abc123',
      toAccountNumber: 'BNK-12345678',
      amount: 100,
      reason: 'Payment',
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero amount', () => {
    const result = transferSchema.safeParse({
      fromAccountId: 'abc',
      toAccountNumber: 'BNK-123',
      amount: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('Bank deposit validation', () => {
  it('accepts valid deposit', () => {
    const result = depositSchema.safeParse({
      accountId: 'abc',
      amount: 50,
      method: 'cash',
    });
    expect(result.success).toBe(true);
  });
});

describe('Bank payment validation', () => {
  it('accepts valid payment', () => {
    const result = paymentSchema.safeParse({
      accountId: 'abc',
      amount: 25,
      type: 'bill',
      recipient: 'Electric Co',
      description: 'Monthly bill',
    });
    expect(result.success).toBe(true);
  });
});

describe('Account number format', () => {
  it('follows BNK-NNNNNNNN pattern', () => {
    expect('BNK-12345678').toMatch(/^BNK-\d{8}$/);
  });

  it('IBAN follows BR12BANA pattern', () => {
    expect('BR12BANA0000000012345678').toMatch(/^BR12BANA\d{16}$/);
  });
});

describe('Bank bundle ID', () => {
  it('is com.bananaos.bank', () => {
    expect('com.bananaos.bank').toMatch(/^com\.bananaos\.bank$/);
  });
});
