export type PoliceTab =
  | 'dashboard'
  | 'mdt'
  | 'reports'
  | 'dispatch'
  | 'cases'
  | 'officers'
  | 'rankings'
  | 'vehicles'
  | 'chat'
  | 'admin';

export type PoliceRank = 'cadet' | 'officer' | 'sergeant' | 'lieutenant' | 'captain' | 'chief';
export type OfficerStatus = 'on_duty' | 'off_duty' | 'break' | 'en_route' | 'on_scene';

export interface PoliceOfficer {
  id: string;
  userId: string;
  badgeNumber: string;
  fullName: string;
  firstName: string;
  lastName: string;
  rank: PoliceRank;
  unit: string;
  points: number;
  status: OfficerStatus;
  isOnline: boolean;
  location?: { lat: number; lng: number; updatedAt?: string };
  lastActiveAt?: string;
}

export interface PoliceDashboard {
  officer: PoliceOfficer | null;
  officersOnline: number;
  activeCases: number;
  activeDispatches: number;
  pendingReports: number;
  priorityAlerts: PoliceDispatch[];
}

export interface PoliceDispatch {
  id: string;
  dispatchNumber: string;
  priority: number;
  type: string;
  description: string;
  location: string;
  status: string;
  assignedOfficerIds: string[];
  createdAt?: string;
}

export interface PoliceCase {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: string;
  priority: number;
  location?: string;
  involvedParties: string[];
  assignedOfficerIds: string[];
  createdAt?: string;
}

export interface PoliceReport {
  id: string;
  reportNumber: string;
  type: string;
  title: string;
  description: string;
  location: string;
  status: string;
  reviewNote?: string;
  createdAt?: string;
}

export interface PoliceVehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  ownerName: string;
  ownerIdentityNumber?: string;
  status?: string;
}

export interface PoliceProperty {
  id: string;
  propertyId: string;
  address: string;
  ownerName: string;
  type: string;
  status?: string;
}

export interface MdtPersonResult {
  identities: Array<{ source: string; fullName: string; nationalId?: string; username?: string; status?: string; verified?: boolean }>;
  contacts: Array<{ source: string; id: string; fullName: string; identityNumber?: string; phoneNumbers?: Array<{ number: string; label?: string }> }>;
}

export interface PoliceEvidence {
  id: string;
  title: string;
  type: string;
  description?: string;
  fileUrl?: string;
  caseId?: string;
  reportId?: string;
  createdAt?: string;
}

export interface PoliceChatMessage {
  id: string;
  channel: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface RankHistoryEntry {
  id: string;
  previousRank: PoliceRank;
  newRank: PoliceRank;
  pointsChange?: number;
  reason: string;
  createdAt: string;
}

export interface PoliceAuditEntry {
  id: string;
  action: string;
  entityType: string;
  query?: string;
  permission: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PoliceAlert {
  id: string;
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface AdminStats {
  officers: number;
  cases: number;
  dispatches: number;
  reports: number;
  auditLogCount: number;
}
