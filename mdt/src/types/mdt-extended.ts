import type { JobType } from "@/lib/config/jobs";

export interface DutyLogEntry {
  id: string;
  officerId: string;
  officerName: string;
  action: "on_duty" | "off_duty";
  timestamp: string;
  department: string;
}

export interface RankChangeLog {
  id: string;
  officerId: string;
  officerName: string;
  fromRank: string;
  toRank: string;
  type: "promotion" | "demotion";
  timestamp: string;
  authorizedBy: string;
}

export interface CriminalCharge {
  id: string;
  code: string;
  label: string;
  fine: number;
  jailMonths: number;
  category: string;
  active: boolean;
}

export interface FtoReport {
  id: string;
  traineeName: string;
  ftoName: string;
  date: string;
  phase: string;
  score: number;
  notes: string;
  status: "pending" | "approved" | "failed";
}

export interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline" | "recording";
  lastMotion?: string;
}

export interface BodycamRecording {
  id: string;
  officerName: string;
  callsign: string;
  startedAt: string;
  durationMin: number;
  incidentId?: string;
  thumbnail?: string;
}

export interface AnalyticsSnapshot {
  totalReports: number;
  activeWarrants: number;
  incidentsToday: number;
  officersOnDuty: number;
  avgResponseMin: number;
  evidenceItems: number;
}

export interface CitizenRecord {
  id: string;
  name: string;
  dob: string;
  phone: string;
  licenses: string[];
  warrants: number;
  flags: string[];
  jobType?: JobType;
}
