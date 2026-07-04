export type ContactsTab = 'home' | 'list' | 'favorites' | 'groups' | 'emergency' | 'blocked' | 'import' | 'admin';

export interface PhoneNumberEntry {
  number: string;
  label: 'mobile' | 'home' | 'work' | 'other';
  primary: boolean;
}

export interface Contact {
  id: string;
  type: 'personal' | 'business' | 'emergency';
  firstName: string;
  lastName?: string;
  fullName: string;
  username?: string;
  phoneNumbers: PhoneNumberEntry[];
  primaryPhone?: string;
  identityNumber?: string;
  email?: string;
  organizationId?: string;
  organizationName?: string;
  department?: string;
  role?: string;
  status: 'active' | 'archived';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  birthday?: string;
  notes?: string;
  avatar?: string;
  tags: string[];
  customLabels: string[];
  relationshipLabel?: string;
  isFavorite: boolean;
  isBlocked: boolean;
  isEmergency: boolean;
  groupIds: string[];
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  contactCount: number;
  contactIds: string[];
}

export interface ContactsDashboard {
  totalContacts: number;
  favoriteCount: number;
  blockedCount: number;
  emergencyCount: number;
  groupCount: number;
  organizationCount: number;
  recentContacts: Contact[];
}

export interface ContactAuditEntry {
  id: string;
  action: string;
  entityType: string;
  permission: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  ipAddress?: string;
  deviceId?: string;
  createdAt: string;
}
