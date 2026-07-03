export type UserRole = "super_admin" | "admin" | "supervisor" | "officer";

export type Permission =
  | "dashboard"
  | "citizens"
  | "incidents"
  | "reports"
  | "fto_reports"
  | "roster"
  | "vehicles"
  | "criminal_code"
  | "warrants"
  | "officers"
  | "cameras"
  | "bodycam"
  | "dispatch"
  | "weapons"
  | "admin_panel"
  | "doj_dossier";

export interface OfficerProfile {
  id: string;
  name: string;
  rank: string;
  department: string;
  callsign: string;
  badges: string[];
  hours: number;
}

export interface AuthAccount {
  id: string;
  username: string;
  passwordHash: string;
  officer: OfficerProfile;
  role: UserRole;
  permissions: Permission[];
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface SessionPayload {
  sub: string;
  username: string;
  role: UserRole;
  permissions: Permission[];
  officer: OfficerProfile;
  exp: number;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  target?: string;
  details?: string;
  ip?: string;
}

export interface SystemSettings {
  mdtLockdown: boolean;
  maintenanceMode: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  requireOnDutyForDispatch: boolean;
}
