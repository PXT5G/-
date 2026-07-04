export type MembershipLevel = 'standard' | 'silver' | 'gold' | 'platinum';
export type IdentityStatus = 'pending' | 'verified' | 'suspended' | 'expired' | 'rejected';

export interface IdentityData {
  id: string;
  userId: string;
  fullName: string;
  username: string;
  nationalId: string;
  membershipNumber: string;
  membershipLevel: MembershipLevel;
  country: string;
  photo?: string;
  banner?: string;
  biography?: string;
  organization?: string;
  department?: string;
  role?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  additionalInfo?: string;
  digitalSignature?: string;
  issueDate: string;
  expiryDate: string;
  status: IdentityStatus;
  verified: boolean;
  verifiedAt?: string;
  qrPayload: string;
  barcodeValue: string;
  badges: string[];
  achievements: string[];
  profileStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdentitySettings {
  pinEnabled: boolean;
  twoFactorEnabled: boolean;
  fingerprintEnabled: boolean;
  faceUnlockEnabled: boolean;
  notifyVerification: boolean;
  notifyExpiry: boolean;
  notifySecurity: boolean;
  publicProfile: boolean;
  showQRByDefault: boolean;
}

export interface IdentityPermission {
  id: string;
  appId: string;
  permission: string;
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
}

export interface IdentitySession {
  id: string;
  deviceId: string;
  deviceName: string;
  ipAddress?: string;
  userAgent?: string;
  lastActiveAt: string;
  createdAt: string;
  current: boolean;
}

export interface TrustedDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  lastUsedAt: string;
  trusted: boolean;
  ipAddress?: string;
}

export interface VerificationLogEntry {
  id: string;
  method: string;
  result: string;
  verifiedByApp?: string;
  createdAt: string;
}

export interface IdentityHistoryEntry {
  id: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  performedByRole: string;
  createdAt: string;
}

export interface IdentityNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  priority: string;
  read: boolean;
  createdAt: string;
}

export interface IdentityStats {
  verifications: number;
  permissions: number;
  trustedDevices: number;
  historyEvents: number;
  daysUntilExpiry: number;
  membershipLevel: MembershipLevel;
  badges: number;
  achievements: number;
}

export interface VerifyResult {
  result: 'success' | 'failed' | 'expired' | 'suspended';
  identity?: IdentityData;
  message: string;
}

export interface QrData {
  qrPayload: string;
  dataUrl: string;
  barcodeValue: string;
}

export type IdentityTab = 'home' | 'profile' | 'security' | 'verify' | 'documents' | 'notifications' | 'admin';

export interface CreateIdentityInput {
  fullName?: string;
  username?: string;
  country?: string;
  biography?: string;
  organization?: string;
  department?: string;
  role?: string;
  emergencyContact?: { name: string; phone: string; relationship: string };
  additionalInfo?: string;
}

export interface AdminStats {
  total: number;
  verified: number;
  pending: number;
  suspended: number;
  rejected: number;
  verificationsToday: number;
}
