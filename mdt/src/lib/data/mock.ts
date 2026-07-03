import type {
  BOLO,
  BulletinNote,
  Charge,
  DispatchIncident,
  EvidenceItem,
  Officer,
  RadioChannel,
  ReportSummary,
  Unit,
  Warrant,
} from "@/types";

export const currentUser: Officer = {
  id: "off-001",
  name: "James Carter",
  rank: "Sergeant",
  department: "LSPD",
  dutyStatus: "on_duty",
  hours: 142,
  badges: ["FTO", "SWAT"],
  callsign: "1-L-12",
  location: "Mission Row PD",
};

export const bulletinNotes: BulletinNote[] = [
  {
    id: "bb-1",
    title: "Shift Briefing — 0700",
    body: "Increased patrol presence requested in Vinewood and Del Perro. All units confirm radio check before 10-8.",
    author: "Dispatch",
    createdAt: "2026-07-02T07:00:00Z",
  },
  {
    id: "bb-2",
    title: "BOLO Advisory",
    body: "White Sultan RS — partial plate 7K__ — wanted in connection with armed robbery. Approach with caution.",
    author: "Watch Commander",
    createdAt: "2026-07-02T11:30:00Z",
  },
];

export const recentReports: ReportSummary[] = [
  { id: "r-101", name: "Traffic Stop — Legion Square", location: "Legion Square", date: "2026-07-02" },
  { id: "r-102", name: "Assault — Mirror Park", location: "Mirror Park Blvd", date: "2026-07-02" },
  { id: "r-103", name: "Burglary — Vespucci", location: "Vespucci Canals", date: "2026-07-01" },
];

export const activeWarrants: Warrant[] = [
  { id: "w-1", targetName: "Marcus Webb", issueDate: "2026-06-28", status: "active" },
  { id: "w-2", targetName: "Elena Voss", issueDate: "2026-07-01", status: "active" },
];

export const units: Unit[] = [
  { id: "u-1", callsign: "1-A-10", name: "Sarah Mitchell", rank: "Officer", department: "LSPD", status: "available", location: "MRPD" },
  { id: "u-2", callsign: "1-L-12", name: "James Carter", rank: "Sergeant", department: "LSPD", status: "on_scene", location: "Pillbox Hill" },
  { id: "u-3", callsign: "2-K-05", name: "Derek Hayes", rank: "Corporal", department: "BCSO", status: "en_route", location: "Route 68" },
  { id: "u-4", callsign: "1-M-03", name: "Aisha Rahman", rank: "Officer", department: "LSPD", status: "busy", location: "Sandy Shores" },
];

export const bolos: BOLO[] = [
  { id: "b-1", target: "Marcus Webb", vehicle: "White Sultan RS", status: "active" },
  { id: "b-2", target: "Unknown male — red mask", status: "active" },
];

export const dispatchIncidents: DispatchIncident[] = [
  {
    id: "inc-1",
    callNumber: "24-07142",
    time: "14:32",
    location: "Legion Square — San Andreas Ave",
    description: "Reports of shots fired. Multiple callers. Suspect fled on foot northbound.",
    callerName: "Anonymous",
    callerPhone: "555-0142",
  },
  {
    id: "inc-2",
    callNumber: "24-07138",
    time: "14:18",
    location: "Pillbox Hill Medical",
    description: "Disturbance in ER waiting area. Security requesting PD assist.",
    callerName: "Dr. Nguyen",
    callerPhone: "555-0198",
  },
  {
    id: "inc-3",
    callNumber: "24-07129",
    time: "13:55",
    location: "Grove Street",
    description: "Vehicle break-in in progress. Dark blue Baller.",
    callerName: "Franklin Clinton",
    callerPhone: "555-0101",
  },
];

export const radioChannels: RadioChannel[] = [
  { id: "ch-1", name: "Primary", frequency: "154.920", activeUnits: 8 },
  { id: "ch-2", name: "Tactical", frequency: "155.475", activeUnits: 3 },
  { id: "ch-3", name: "Traffic", frequency: "156.070", activeUnits: 2 },
];

export const officers: Officer[] = [
  { id: "off-001", name: "James Carter", rank: "Sergeant", department: "LSPD", dutyStatus: "on_duty", hours: 142, badges: ["FTO", "SWAT"], callsign: "1-L-12" },
  { id: "off-002", name: "Sarah Mitchell", rank: "Officer", department: "LSPD", dutyStatus: "on_duty", hours: 98, badges: ["K9"], callsign: "1-A-10" },
  { id: "off-003", name: "Derek Hayes", rank: "Corporal", department: "BCSO", dutyStatus: "on_duty", hours: 210, badges: ["TE", "FTO"], callsign: "2-K-05" },
  { id: "off-004", name: "Aisha Rahman", rank: "Officer", department: "LSPD", dutyStatus: "off_duty", hours: 76, badges: ["SWAT"], callsign: "1-M-03" },
  { id: "off-005", name: "Tom Bradley", rank: "Lieutenant", department: "LSPD", dutyStatus: "on_duty", hours: 320, badges: ["Command", "FTO"], callsign: "1-C-01" },
  { id: "off-006", name: "Nina Ortiz", rank: "Officer", department: "SAHP", dutyStatus: "off_duty", hours: 54, badges: ["TE"], callsign: "3-T-07" },
];

export const evidenceLockerItems: EvidenceItem[] = [
  { id: "ev-1", name: "9mm Ammo", category: "Ammunition", quantity: 24, secured: true, reportId: "r-101" },
  { id: "ev-2", name: "Pistol", category: "Firearm", quantity: 1, secured: true, reportId: "r-101" },
  { id: "ev-3", name: "Assault Rifle", category: "Firearm", quantity: 1, secured: true, reportId: "r-102" },
  { id: "ev-4", name: "Phone", category: "Electronics", quantity: 1, secured: true, reportId: "r-102" },
  { id: "ev-5", name: "Knife", category: "Weapon", quantity: 1, secured: true, reportId: "r-103" },
  { id: "ev-6", name: "Stolen Goods", category: "Misc", quantity: 3, secured: true, reportId: "r-103" },
];

export const sampleCharges: Charge[] = [
  { id: "c-1", label: "Reckless Driving", amount: 500 },
  { id: "c-2", label: "Failure to Yield", amount: 250 },
  { id: "c-3", label: "Expired Registration", amount: 150 },
];
