export type DutyStatus = "on_duty" | "off_duty";

export type UnitStatus = "available" | "busy" | "en_route" | "on_scene";

export interface Officer {
  id: string;
  name: string;
  rank: string;
  department: string;
  dutyStatus: DutyStatus;
  hours: number;
  badges: string[];
  callsign?: string;
  location?: string;
}

export interface BulletinNote {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
}

export interface ReportSummary {
  id: string;
  name: string;
  location: string;
  date: string;
}

export interface Warrant {
  id: string;
  targetName: string;
  issueDate: string;
  status: "active" | "served" | "expired";
}

export interface Unit {
  id: string;
  callsign: string;
  name: string;
  rank: string;
  department: string;
  status: UnitStatus;
  location: string;
}

export interface BOLO {
  id: string;
  target: string;
  vehicle?: string;
  status: "active" | "cleared";
}

export interface DispatchIncident {
  id: string;
  callNumber: string;
  time: string;
  location: string;
  description: string;
  callerName: string;
  callerPhone: string;
  priority: "high" | "medium" | "low";
  status: "active" | "pending" | "closed";
  mapX: number;
  mapY: number;
}

export interface RadioChannel {
  id: string;
  name: string;
  frequency: string;
  activeUnits: number;
}

export interface EvidenceItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  secured: boolean;
  reportId: string;
}

export interface Charge {
  id: string;
  label: string;
  amount: number;
}

export interface NavItem {
  key: string;
  href: string;
  icon: string;
}
