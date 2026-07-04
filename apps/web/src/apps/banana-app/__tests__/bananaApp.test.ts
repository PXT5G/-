import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(2000),
});

describe('Banana App Store validation', () => {
  it('accepts valid review', () => {
    const result = reviewSchema.safeParse({
      rating: 5,
      title: 'Great app',
      body: 'Works perfectly on BananaOS.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid rating', () => {
    const result = reviewSchema.safeParse({
      rating: 6,
      title: 'Bad',
      body: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = reviewSchema.safeParse({
      rating: 3,
      title: '',
      body: 'Test body',
    });
    expect(result.success).toBe(false);
  });
});

describe('Store bundle IDs', () => {
  const validBundleIds = [
    'com.bananaos.store',
    'com.bananaos.identity',
    'com.bananaos.bank',
  ];

  it('follows reverse-domain convention', () => {
    validBundleIds.forEach((id) => {
      expect(id).toMatch(/^com\.bananaos\.\w+$/);
    });
  });
});
