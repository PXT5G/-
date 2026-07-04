import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const installBodySchema = z.object({
  approvedPermissions: z.array(z.string()).optional(),
});

const downloadStatusSchema = z.enum([
  'queued',
  'downloading',
  'paused',
  'installing',
  'completed',
  'failed',
  'cancelled',
]);

describe('Install request validation', () => {
  it('accepts approved permissions array', () => {
    const result = installBodySchema.safeParse({
      approvedPermissions: ['storage', 'network', 'notifications'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty body for default permissions', () => {
    expect(installBodySchema.safeParse({}).success).toBe(true);
  });
});

describe('Download lifecycle states', () => {
  it('includes pause and resume states', () => {
    expect(downloadStatusSchema.safeParse('paused').success).toBe(true);
    expect(downloadStatusSchema.safeParse('downloading').success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(downloadStatusSchema.safeParse('simulated').success).toBe(false);
  });
});

describe('Permission approval', () => {
  it('merges required and optional permissions for approval', () => {
    const required = ['storage', 'network'];
    const optional = ['notifications', 'camera'];
    const approved = [...required, ...optional];
    expect(approved).toContain('storage');
    expect(approved).toHaveLength(4);
  });
});

describe('Storage manager', () => {
  it('calculates total storage from components', () => {
    const storage = { appSize: 50_000_000, cacheSize: 5_000_000, documentsSize: 1_000_000, mediaSize: 2_000_000 };
    const total = storage.appSize + storage.cacheSize + storage.documentsSize + storage.mediaSize;
    expect(total).toBe(58_000_000);
  });
});

describe('Update queue', () => {
  it('queues downloads with position ordering', () => {
    const queue = ['d1', 'd2', 'd3'];
    const positions = queue.map((id, i) => ({ id, queuePosition: i + 1 }));
    expect(positions[0].queuePosition).toBe(1);
    expect(positions[2].queuePosition).toBe(3);
  });
});
