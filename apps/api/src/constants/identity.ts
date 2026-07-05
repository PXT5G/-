/** GULF Identity — com.gulfos.identity digital identity constants */

export const IDENTITY_APP_BUNDLE = 'com.gulfos.identity' as const;

export const IDENTITY_STATUSES = ['pending', 'verified', 'suspended', 'revoked', 'expired'] as const;
export type IdentityStatus = (typeof IDENTITY_STATUSES)[number];

export const DOCUMENT_TYPES = [
  'national_id', 'passport', 'driving_license', 'residency_permit',
  'vehicle_ownership', 'property_ownership', 'business_ownership',
  'marine_ownership', 'aircraft_ownership', 'medical_card', 'insurance',
  'police_badge', 'justice_credential', 'emergency_card',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const VERIFICATION_METHODS = ['qr', 'barcode', 'nfc', 'biometric', 'manual'] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export const IDENTITY_ROLES = ['citizen', 'resident', 'visitor', 'official', 'admin'] as const;
export type IdentityRole = (typeof IDENTITY_ROLES)[number];

export const IDENTITY_PERMISSIONS = [
  'platform.access', 'profile.view', 'profile.manage', 'documents.view',
  'documents.manage', 'verification.request', 'verification.approve',
  'signature.create', 'signature.verify', 'qr.generate', 'qr.scan',
  'nfc.read', 'nfc.write', 'biometric.verify', 'emergency.view',
  'emergency.manage', 'ownership.view', 'ownership.manage',
  'government.integrate', 'audit.view', 'export.vcard', 'export.pdf',
] as const;
export type IdentityPermission = (typeof IDENTITY_PERMISSIONS)[number];

export const DEFAULT_IDENTITY_ROLE_PERMISSIONS: Record<IdentityRole, IdentityPermission[]> = {
  citizen: IDENTITY_PERMISSIONS.filter((p) => p !== 'verification.approve' && p !== 'government.integrate'),
  resident: IDENTITY_PERMISSIONS.filter((p) =>
    !['verification.approve', 'government.integrate', 'ownership.manage'].includes(p)
  ),
  visitor: IDENTITY_PERMISSIONS.filter((p) =>
    ['platform.access', 'profile.view', 'documents.view', 'verification.request',
      'qr.generate', 'qr.scan', 'emergency.view'].includes(p)
  ),
  official: [...IDENTITY_PERMISSIONS],
  admin: [...IDENTITY_PERMISSIONS],
};

export const IDENTITY_SOCKET_EVENTS = [
  'identity:update', 'identity:verified', 'identity:document:added',
  'identity:verification:completed', 'identity:initialized', 'identity:revoked',
] as const;
