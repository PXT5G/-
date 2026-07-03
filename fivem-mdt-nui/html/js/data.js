/**
 * بيانات تجريبية — يستبدلها السيرفر عبر SendNUIMessage
 * Discord Bot API: اربط هذا الملف بـ exports أو استبدل بـ fetch من NUI callback
 */
export const MOCK = {
  bulletins: [
    {
      id: "bb-1",
      title: "إحاطة الوردية — 0700",
      body: "تعزيز الدوريات في Vinewood و Del Perro.",
      author: "الإرسال",
      time: "07:00",
    },
    {
      id: "bb-2",
      title: "تنبيه BOLO",
      body: "Sultan RS أبيض — لوحة 7K__ — سرقة مسلحة.",
      author: "قائد المناوبة",
      time: "11:30",
    },
  ],
  warrants: [
    { id: "w-1", name: "Marcus Webb", date: "2026-06-28", status: "active" },
    { id: "w-2", name: "Elena Voss", date: "2026-07-01", status: "active" },
  ],
  incidents: [
    {
      id: "inc-1",
      callNumber: "24-07142",
      time: "14:32",
      location: "Legion Square",
      description: "إطلاق نار — مشتبه هرب شمالاً",
      priority: "high",
      status: "active",
      mapX: 46,
      mapY: 44,
    },
    {
      id: "inc-2",
      callNumber: "24-07138",
      time: "14:18",
      location: "Pillbox Hill",
      description: "شغب في صالة الانتظار",
      priority: "medium",
      status: "pending",
      mapX: 52,
      mapY: 38,
    },
    {
      id: "inc-3",
      callNumber: "24-07129",
      time: "13:55",
      location: "Grove Street",
      description: "كسر سيارة — Baller أزرق",
      priority: "medium",
      status: "active",
      mapX: 35,
      mapY: 62,
    },
  ],
  units: [
    { id: "u-1", callsign: "1-A-10", name: "Sarah Mitchell", status: "available" },
    { id: "u-2", callsign: "1-L-12", name: "James Carter", status: "on_scene" },
    { id: "u-3", callsign: "2-K-05", name: "Derek Hayes", status: "en_route" },
  ],
  citizens: [
    {
      id: "doss-001",
      fullName: "Marcus Webb",
      nationalId: "LS-928471",
      phone: "555-0201",
      flags: ["مطلوب", "خطير"],
      warrants: 2,
      bankBalance: 12450,
      vehicles: [
        { plate: "7KAB442", model: "Sultan RS", status: "مطلوب" },
      ],
      properties: [{ label: "شقة Grove", value: 185000 }],
      records: [
        { type: "اعتقال", description: "حيازة سلاح", date: "2026-06-28" },
      ],
    },
    {
      id: "doss-002",
      fullName: "Elena Voss",
      nationalId: "LS-441209",
      phone: "555-0188",
      flags: ["مذكرة توقيف"],
      warrants: 1,
      bankBalance: 89200,
      vehicles: [{ plate: "VWD8821", model: "Comet S2", status: "مسجّل" }],
      properties: [{ label: "فيلا Vinewood", value: 920000 }],
      records: [],
    },
  ],
};

export const NAV = [
  { id: "dashboard", icon: "◈", label: "لوحة التحكم" },
  { id: "dispatch", icon: "◎", label: "الإرسال" },
  { id: "search", icon: "⌕", label: "بحث مواطن" },
  { id: "warrants", icon: "⚖", label: "مذكرات التوقيف" },
  { id: "reports", icon: "▤", label: "التقارير" },
];

export const STATUS_LABELS = {
  available: "متاح",
  on_scene: "في الموقع",
  en_route: "في الطريق",
  busy: "مشغول",
  active: "نشط",
  pending: "انتظار",
  closed: "مغلق",
  high: "عاجل",
  medium: "متوسط",
  low: "منخفض",
};
