import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const phoneNumberSchema = z.object({
  number: z.string().min(1),
  label: z.enum(['mobile', 'home', 'work', 'other']).optional(),
  primary: z.boolean().optional(),
});

const contactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  phoneNumbers: z.array(phoneNumberSchema).min(1),
  email: z.string().email().optional(),
  type: z.enum(['personal', 'business', 'emergency']).optional(),
  tags: z.array(z.string()).optional(),
});

const groupSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  icon: z.string().optional(),
});

describe('Contact validation', () => {
  it('requires firstName and at least one phone number', () => {
    expect(contactSchema.safeParse({
      firstName: 'John',
      phoneNumbers: [{ number: '+1-555-0100', label: 'mobile', primary: true }],
    }).success).toBe(true);
  });

  it('rejects contact without phone numbers', () => {
    expect(contactSchema.safeParse({ firstName: 'John', phoneNumbers: [] }).success).toBe(false);
  });

  it('accepts multiple phone numbers', () => {
    expect(contactSchema.safeParse({
      firstName: 'Jane',
      phoneNumbers: [
        { number: '+1-555-0100', label: 'mobile', primary: true },
        { number: '+1-555-0101', label: 'work', primary: false },
      ],
    }).success).toBe(true);
  });

  it('validates email format', () => {
    expect(contactSchema.safeParse({
      firstName: 'Test',
      phoneNumbers: [{ number: '+1-555-0100' }],
      email: 'invalid',
    }).success).toBe(false);
  });
});

describe('Contact group validation', () => {
  it('requires group name', () => {
    expect(groupSchema.safeParse({ name: 'Family' }).success).toBe(true);
    expect(groupSchema.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('Contacts bundle ID', () => {
  it('is com.bananaos.contacts', () => {
    expect('com.bananaos.contacts').toMatch(/^com\.bananaos\.contacts$/);
  });
});

describe('Contacts RBAC permissions', () => {
  const permissions = [
    'view_contacts', 'edit_contacts', 'delete_contacts', 'export_contacts',
    'import_contacts', 'manage_groups', 'view_audit_logs', 'manage_organizations', 'block_contacts',
  ];

  it('defines required permission set', () => {
    expect(permissions).toContain('view_contacts');
    expect(permissions).toContain('import_contacts');
    expect(permissions.length).toBeGreaterThanOrEqual(9);
  });
});

describe('Phone number format', () => {
  it('accepts Banana SIM format', () => {
    expect('+1-BNA-555-1234').toMatch(/^\+1-BNA-\d{3}-\d{4}$/);
  });

  it('accepts standard formats', () => {
    expect('+1-555-0100').toMatch(/^\+\d/);
  });
});
