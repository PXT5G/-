import type { CitizenDossier } from "@/types/doj-dossier";

export const citizenDossiers: CitizenDossier[] = [
  {
    id: "doss-001",
    nationalId: "LS-928471",
    firstName: "Marcus",
    lastName: "Webb",
    fullName: "Marcus Webb",
    dob: "1992-04-12",
    phone: "555-0201",
    email: "m.webb@mail.ls",
    address: "Grove St 14, Los Santos",
    photoSeed: "marcus",
    flags: ["مطلوب", "خطير", "سلاح"],
    licenses: ["قيادة (معلّق)"],
    bankBalance: 12450,
    finesOwed: 8500,
    warrants: 2,
    vehicles: [
      { id: "v1", plate: "7KAB442", model: "Sultan RS", color: "أبيض", registeredAt: "2024-03-10", status: "مطلوب" },
      { id: "v2", plate: "4PLT119", model: "Baller", color: "أسود", registeredAt: "2023-11-02", status: "مسجّل" },
    ],
    properties: [
      { id: "p1", label: "شقة Grove", address: "Grove St 14", type: "شقة", value: 185000, purchasedAt: "2021-06-15" },
    ],
    transactions: [
      { id: "t1", type: "غرامة", amount: -2500, date: "2026-06-20", note: "قيادة متهورة" },
      { id: "t2", type: "سحب", amount: -1200, date: "2026-05-11", note: "ATM Pillbox" },
      { id: "t3", type: "إيداع", amount: 5000, date: "2026-04-01", note: "تحويل وارد" },
    ],
    records: [
      { id: "r1", type: "اعتقال", description: "حيازة سلاح غير مرخص", date: "2026-06-28", officer: "Carter" },
      { id: "r2", type: "بلاغ", description: "سرقة مسلحة — Mirror Park", date: "2026-06-15" },
    ],
    notes: "اشتباه في عضوية عصابة. يُراجع قبل أي إفراج.",
  },
  {
    id: "doss-002",
    nationalId: "LS-441209",
    firstName: "Elena",
    lastName: "Voss",
    fullName: "Elena Voss",
    dob: "1988-11-03",
    phone: "555-0188",
    address: "Vinewood Hills 22",
    photoSeed: "elena",
    flags: ["مذكرة توقيف"],
    licenses: ["قيادة", "سلاح"],
    bankBalance: 89200,
    finesOwed: 1200,
    warrants: 1,
    vehicles: [
      { id: "v3", plate: "VWD8821", model: "Comet S2", color: "أحمر", registeredAt: "2025-01-20", status: "مسجّل" },
    ],
    properties: [
      { id: "p2", label: "فيلا Vinewood", address: "Vinewood Hills 22", type: "فيلا", value: 920000, purchasedAt: "2020-09-01" },
      { id: "p3", label: "مستودع", address: "La Puerta", type: "تجاري", value: 310000, purchasedAt: "2022-02-14" },
    ],
    transactions: [
      { id: "t4", type: "تحويل", amount: 15000, date: "2026-07-01", note: "Maze Bank" },
      { id: "t5", type: "غرامة", amount: -1200, date: "2026-03-22", note: "تجاوز سرعة" },
    ],
    records: [
      { id: "r3", type: "تحقيق", description: "غسيل أموال — قيد النظر", date: "2026-07-01", officer: "Bradley" },
    ],
  },
  {
    id: "doss-003",
    nationalId: "LS-102938",
    firstName: "Franklin",
    lastName: "Clinton",
    fullName: "Franklin Clinton",
    dob: "1985-06-15",
    phone: "555-0101",
    address: "Forum Dr 3671",
    photoSeed: "franklin",
    flags: [],
    licenses: ["قيادة", "صيد"],
    bankBalance: 45600,
    finesOwed: 0,
    warrants: 0,
    vehicles: [
      { id: "v4", plate: "FRA001", model: "Buffalo STX", color: "أخضر", registeredAt: "2024-08-05", status: "مسجّل" },
    ],
    properties: [
      { id: "p4", label: "منزل Forum Dr", address: "Forum Dr 3671", type: "منزل", value: 275000, purchasedAt: "2019-12-01" },
    ],
    transactions: [
      { id: "t6", type: "إيداع", amount: 8200, date: "2026-06-30", note: "راتب" },
    ],
    records: [],
  },
  {
    id: "doss-004",
    nationalId: "LS-556677",
    firstName: "أحمد",
    lastName: "الراشد",
    fullName: "أحمد الراشد",
    dob: "1995-02-20",
    phone: "555-0444",
    address: "Little Seoul 8",
    photoSeed: "ahmed",
    flags: [],
    licenses: ["قيادة"],
    bankBalance: 22100,
    finesOwed: 450,
    warrants: 0,
    vehicles: [],
    properties: [],
    transactions: [
      { id: "t7", type: "غرامة", amount: -450, date: "2026-06-10", note: "وقوف خاطئ" },
    ],
    records: [],
  },
];

export function searchDossiers(query: string): CitizenDossier[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return citizenDossiers.filter((d) => {
    const haystack = [
      d.firstName,
      d.lastName,
      d.fullName,
      d.nationalId,
      d.phone,
      d.address,
      ...d.vehicles.map((v) => v.plate),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q) || d.firstName.toLowerCase().startsWith(q);
  });
}

export function getDossierById(id: string): CitizenDossier | undefined {
  return citizenDossiers.find((d) => d.id === id);
}
