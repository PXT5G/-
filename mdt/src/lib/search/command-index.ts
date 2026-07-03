import { citizenDossiers } from "@/lib/data/doj-dossiers";
import { recentReports } from "@/lib/data/mock";
import { messages } from "@/lib/i18n/messages";
import type { Permission } from "@/lib/auth/types";

export type CommandItemType = "page" | "citizen" | "report" | "action";

export interface CommandItem {
  id: string;
  type: CommandItemType;
  label: string;
  subtitle?: string;
  href: string;
  keywords: string[];
  perm?: Permission;
}

const pageItems: CommandItem[] = [
  { id: "p-dash", type: "page", label: messages.nav.dashboard, href: "/", keywords: ["dashboard", "لوحة"], perm: "dashboard" },
  { id: "p-doj", type: "page", label: messages.nav.dojDossier, href: "/doj", keywords: ["doj", "عدل", "ملف"], perm: "doj_dossier" },
  { id: "p-citizens", type: "page", label: messages.nav.citizens, href: "/citizens", keywords: ["citizens", "مواطن"], perm: "citizens" },
  { id: "p-dispatch", type: "page", label: messages.nav.dispatch, href: "/dispatch", keywords: ["dispatch", "إرسال"], perm: "dispatch" },
  { id: "p-reports", type: "page", label: messages.nav.reports, href: "/reports", keywords: ["reports", "تقرير"], perm: "reports" },
  { id: "p-warrants", type: "page", label: messages.nav.warrant, href: "/warrants", keywords: ["warrant", "مذكرة"], perm: "warrants" },
  { id: "p-incidents", type: "page", label: messages.nav.incidents, href: "/incidents", keywords: ["incidents", "حادث"], perm: "incidents" },
  { id: "p-vehicles", type: "page", label: messages.nav.vehicles, href: "/vehicles", keywords: ["vehicles", "مركبة"], perm: "vehicles" },
  { id: "p-officers", type: "page", label: messages.nav.officersManagement, href: "/officers", keywords: ["officers", "ضابط"], perm: "officers" },
  { id: "p-cameras", type: "page", label: messages.nav.securityCameras, href: "/cameras", keywords: ["cameras", "كاميرا"], perm: "cameras" },
  { id: "p-bodycam", type: "page", label: messages.nav.bodycam, href: "/bodycam", keywords: ["bodycam"], perm: "bodycam" },
  { id: "p-criminal", type: "page", label: messages.nav.criminalCode, href: "/criminal-code", keywords: ["criminal", "قانون"], perm: "criminal_code" },
];

function citizenItems(): CommandItem[] {
  return citizenDossiers.map((d) => ({
    id: `c-${d.id}`,
    type: "citizen" as const,
    label: d.fullName,
    subtitle: `${d.nationalId} · ${d.phone}`,
    href: `/doj/${d.id}`,
    keywords: [d.firstName, d.lastName, d.fullName, d.nationalId, d.phone, ...d.vehicles.map((v) => v.plate)],
    perm: "doj_dossier" as Permission,
  }));
}

function reportItems(): CommandItem[] {
  return recentReports.map((r) => ({
    id: `r-${r.id}`,
    type: "report" as const,
    label: r.name,
    subtitle: r.location,
    href: `/reports/${r.id}`,
    keywords: [r.name, r.location, r.id],
    perm: "reports" as Permission,
  }));
}

export function buildCommandIndex(): CommandItem[] {
  return [...pageItems, ...citizenItems(), ...reportItems()];
}

export function searchCommands(
  query: string,
  can: (perm: Permission) => boolean,
): CommandItem[] {
  const q = query.trim().toLowerCase();
  const all = buildCommandIndex().filter((item) => !item.perm || can(item.perm));

  if (!q) return all.slice(0, 12);

  return all
    .filter((item) => {
      const hay = [item.label, item.subtitle ?? "", ...item.keywords].join(" ").toLowerCase();
      return hay.includes(q) || item.keywords.some((k) => k.toLowerCase().startsWith(q));
    })
    .slice(0, 16);
}
