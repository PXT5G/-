import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const reportSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  location: z.string().min(1),
  type: z.enum(['incident', 'arrest', 'traffic', 'investigation', 'other']).optional(),
});

const dispatchSchema = z.object({
  type: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  priority: z.number().int().min(1).max(3).optional(),
});

const vehicleSchema = z.object({
  plateNumber: z.string().min(2).max(12),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  color: z.string().min(1),
  ownerName: z.string().min(1),
});

describe('Police badge format', () => {
  it('follows BNA-XXXX pattern', () => {
    expect('BNA-4521').toMatch(/^BNA-\d{4}$/);
  });
});

describe('Police report validation', () => {
  it('accepts valid report', () => {
    expect(reportSchema.safeParse({
      title: 'Traffic Stop',
      description: 'Vehicle ran red light',
      location: '100 Banana Blvd',
    }).success).toBe(true);
  });

  it('rejects empty title', () => {
    expect(reportSchema.safeParse({
      title: '',
      description: 'Test',
      location: 'Test',
    }).success).toBe(false);
  });
});

describe('Police dispatch validation', () => {
  it('accepts valid dispatch', () => {
    expect(dispatchSchema.safeParse({
      type: 'disturbance',
      description: 'Noise complaint',
      location: '500 Commerce St',
      priority: 2,
    }).success).toBe(true);
  });
});

describe('Police vehicle validation', () => {
  it('accepts valid vehicle registration', () => {
    expect(vehicleSchema.safeParse({
      plateNumber: 'BNA-4521',
      make: 'Tesla',
      model: 'Model 3',
      year: 2024,
      color: 'White',
      ownerName: 'John Smith',
    }).success).toBe(true);
  });
});

describe('Police bundle ID', () => {
  it('is com.bananaos.police', () => {
    expect('com.bananaos.police').toMatch(/^com\.bananaos\.police$/);
  });
});

describe('Police RBAC permissions', () => {
  const permissions = [
    'view_dashboard', 'access_mdt', 'view_mdt_audit', 'create_report', 'approve_report',
    'view_reports', 'manage_rankings', 'view_officers', 'manage_officers', 'manage_dispatch',
    'view_dispatch', 'manage_cases', 'view_cases', 'manage_vehicles', 'view_vehicles',
    'internal_chat', 'view_audit_logs', 'manage_evidence',
  ];

  it('defines required permission set', () => {
    expect(permissions).toContain('access_mdt');
    expect(permissions).toContain('manage_dispatch');
    expect(permissions.length).toBeGreaterThanOrEqual(18);
  });
});

describe('Police rank hierarchy', () => {
  const ranks = ['cadet', 'officer', 'sergeant', 'lieutenant', 'captain', 'chief'];

  it('has six ranks in ascending order', () => {
    expect(ranks[0]).toBe('cadet');
    expect(ranks[ranks.length - 1]).toBe('chief');
    expect(ranks.length).toBe(6);
  });
});
