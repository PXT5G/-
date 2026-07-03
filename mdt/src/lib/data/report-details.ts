export interface ReportPerson {
  id: string;
  name: string;
  role: string;
  dob?: string;
  notes?: string;
}

export interface ReportVehicle {
  id: string;
  plate: string;
  model: string;
  color: string;
  owner?: string;
}

export interface ReportOverview {
  summary: string;
  officer: string;
  status: string;
  createdAt: string;
}

export interface ReportEvidence {
  id: string;
  name: string;
  description: string;
  collectedAt: string;
}

const reports: Record<
  string,
  {
    overview: ReportOverview;
    people: ReportPerson[];
    vehicles: ReportVehicle[];
    evidence: ReportEvidence[];
  }
> = {
  "r-101": {
    overview: {
      summary: "إيقاف مروري روتيني في Legion Square. السائق متعاون. تم إصدار مخالفة سرعة.",
      officer: "James Carter",
      status: "مغلق",
      createdAt: "2026-07-02T14:10:00Z",
    },
    people: [
      { id: "p1", name: "أحمد الراشد", role: "سائق", dob: "1995-02-20" },
    ],
    vehicles: [
      { id: "rv1", plate: "LSK8821", model: "Futo", color: "أزرق", owner: "أحمد الراشد" },
    ],
    evidence: [
      { id: "e1", name: "تسجيل Bodycam", description: "تسجيل كامل للإيقاف", collectedAt: "2026-07-02" },
    ],
  },
  "r-102": {
    overview: {
      summary: "شجار في Mirror Park. ضحية بإصابات طفيفة. مشتبه واحد في الحجز.",
      officer: "Sarah Mitchell",
      status: "قيد التحقيق",
      createdAt: "2026-07-02T11:45:00Z",
    },
    people: [
      { id: "p2", name: "Marcus Webb", role: "مشتبه", notes: "مطلوب سابقاً" },
      { id: "p3", name: "ضحية — John Doe", role: "ضحية" },
    ],
    vehicles: [],
    evidence: [
      { id: "e2", name: "سكين", description: "مضبوط في موقع الحادث", collectedAt: "2026-07-02" },
      { id: "e3", name: "صور CCTV", description: "كاميرا Mirror Park #4", collectedAt: "2026-07-02" },
    ],
  },
  "r-103": {
    overview: {
      summary: "سطو على منزل في Vespucci Canals. لا وجود للمشتبه. تحقيق مستمر.",
      officer: "Derek Hayes",
      status: "مفتوح",
      createdAt: "2026-07-01T22:30:00Z",
    },
    people: [
      { id: "p4", name: "Elena Voss", role: "مشتري المنزل / شاهد" },
    ],
    vehicles: [
      { id: "rv2", plate: "VWD8821", model: "Comet S2", color: "أحمر", owner: "Elena Voss" },
    ],
    evidence: [
      { id: "e4", name: "بصمات", description: "على نافذة مكسورة", collectedAt: "2026-07-01" },
    ],
  },
};

const fallback = {
  overview: {
    summary: "تقرير قيد المعالجة — البيانات ستُحمّل من Discord Bot API.",
    officer: "—",
    status: "مسودة",
    createdAt: new Date().toISOString(),
  },
  people: [] as ReportPerson[],
  vehicles: [] as ReportVehicle[],
  evidence: [] as ReportEvidence[],
};

export function getReportDetails(reportId: string) {
  return reports[reportId] ?? fallback;
}
