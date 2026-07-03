import type {
  BodycamRecording,
  CameraFeed,
  CriminalCharge,
  DutyLogEntry,
  FtoReport,
  RankChangeLog,
  AnalyticsSnapshot,
  CitizenRecord,
} from "@/types/mdt-extended";

export const dutyLogs: DutyLogEntry[] = [
  { id: "dl-1", officerId: "off-001", officerName: "James Carter", action: "on_duty", timestamp: "2026-07-02T06:55:00Z", department: "LSPD" },
  { id: "dl-2", officerId: "off-002", officerName: "Sarah Mitchell", action: "on_duty", timestamp: "2026-07-02T07:10:00Z", department: "LSPD" },
  { id: "dl-3", officerId: "off-004", officerName: "Aisha Rahman", action: "off_duty", timestamp: "2026-07-01T22:30:00Z", department: "LSPD" },
  { id: "dl-4", officerId: "off-003", officerName: "Derek Hayes", action: "on_duty", timestamp: "2026-07-02T08:00:00Z", department: "BCSO" },
];

export const rankChangeLogs: RankChangeLog[] = [
  { id: "rc-1", officerId: "off-002", officerName: "Sarah Mitchell", fromRank: "Cadet", toRank: "Officer", type: "promotion", timestamp: "2026-05-15T10:00:00Z", authorizedBy: "Tom Bradley" },
  { id: "rc-2", officerId: "off-001", officerName: "James Carter", fromRank: "Officer", toRank: "Sergeant", type: "promotion", timestamp: "2026-03-01T10:00:00Z", authorizedBy: "Command" },
];

export const criminalCharges: CriminalCharge[] = [
  { id: "ch-1", code: "P.C. 1001", label: "القيادة بتهور", fine: 500, jailMonths: 0, category: "مرور", active: true },
  { id: "ch-2", code: "P.C. 2003", label: "الاعتداء", fine: 1500, jailMonths: 12, category: "جنائي", active: true },
  { id: "ch-3", code: "P.C. 3010", label: "حيازة سلاح غير مرخص", fine: 3000, jailMonths: 24, category: "أسلحة", active: true },
  { id: "ch-4", code: "P.C. 1502", label: "سرقة مركبة", fine: 2500, jailMonths: 18, category: "ممتلكات", active: true },
  { id: "ch-5", code: "P.C. 4011", label: "مقاومة الاعتقال", fine: 800, jailMonths: 6, category: "جنائي", active: false },
];

export const ftoReports: FtoReport[] = [
  { id: "fto-1", traineeName: "Alex Turner", ftoName: "James Carter", date: "2026-07-01", phase: "Phase 2", score: 85, notes: "أداء جيد في المطاردات. يحتاج تحسين في التواصل اللاسلكي.", status: "approved" },
  { id: "fto-2", traineeName: "Mia Chen", ftoName: "Derek Hayes", date: "2026-07-02", phase: "Phase 1", score: 72, notes: "إجراءات التوقيف تحتاج ممارسة إضافية.", status: "pending" },
];

export const cameraFeeds: CameraFeed[] = [
  { id: "cam-1", name: "MRPD — المدخل الرئيسي", location: "Mission Row", status: "online", lastMotion: "2026-07-02T14:20:00Z" },
  { id: "cam-2", name: "Legion Square — تقاطع", location: "Legion Square", status: "recording", lastMotion: "2026-07-02T14:32:00Z" },
  { id: "cam-3", name: "Pillbox — ER", location: "Pillbox Hill", status: "online" },
  { id: "cam-4", name: "Sandy Shores — محطة", location: "Sandy Shores", status: "offline" },
];

export const bodycamRecordings: BodycamRecording[] = [
  { id: "bc-1", officerName: "James Carter", callsign: "1-L-12", startedAt: "2026-07-02T14:00:00Z", durationMin: 32, incidentId: "inc-1" },
  { id: "bc-2", officerName: "Sarah Mitchell", callsign: "1-A-10", startedAt: "2026-07-02T12:15:00Z", durationMin: 18 },
  { id: "bc-3", officerName: "Derek Hayes", callsign: "2-K-05", startedAt: "2026-07-01T20:45:00Z", durationMin: 45, incidentId: "inc-3" },
];

export const analyticsSnapshot: AnalyticsSnapshot = {
  totalReports: 248,
  activeWarrants: 12,
  incidentsToday: 7,
  officersOnDuty: 14,
  avgResponseMin: 4.2,
  evidenceItems: 89,
};

export const citizens: CitizenRecord[] = [
  { id: "cit-1", name: "Marcus Webb", dob: "1992-04-12", phone: "555-0201", licenses: ["قيادة"], warrants: 1, flags: ["مطلوب", "خطير"] },
  { id: "cit-2", name: "Elena Voss", dob: "1988-11-03", phone: "555-0188", licenses: ["قيادة", "سلاح"], warrants: 1, flags: [] },
  { id: "cit-3", name: "Franklin Clinton", dob: "1985-06-15", phone: "555-0101", licenses: ["قيادة"], warrants: 0, flags: [] },
];
