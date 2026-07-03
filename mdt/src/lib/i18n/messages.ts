/**
 * Centralized UI strings for easy Arabic (or other locale) translation.
 * Swap `messages` with `messagesAr` and set <html dir="rtl" lang="ar"> when localizing.
 */
export const messages = {
  app: {
    title: "Police MDT",
    subtitle: "Mobile Data Terminal",
  },
  nav: {
    dashboard: "Dashboard",
    citizens: "Citizens",
    incidents: "Incidents",
    reports: "Reports",
    ftoReports: "FTO Reports",
    roster: "Roster",
    vehicles: "Vehicles",
    criminalCode: "Criminal Code",
    warrant: "Warrant",
    officersManagement: "Officers Management",
    securityCameras: "Security Cameras",
    bodycam: "Bodycam",
    dispatch: "Dispatch",
    weapons: "Weapons",
  },
  profile: {
    onDuty: "On Duty",
    offDuty: "Off Duty",
    toggleDuty: "Toggle duty status",
  },
  dashboard: {
    title: "Dashboard",
    bulletinBoard: "Bulletin Board",
    recentReports: "Recent Reports",
    activeWarrants: "Active Warrants",
    units: "Units",
    bolos: "BOLOs",
    noNotes: "No announcements at this time.",
    callsign: "Callsign",
    name: "Name",
    rank: "Rank",
    department: "Department",
    status: "Status",
    location: "Location",
    target: "Target",
    issueDate: "Issue Date",
    vehicle: "Vehicle",
  },
  dispatch: {
    title: "Dispatch Center",
    unitsAndChannels: "Units & Channels",
    availableUnits: "Available Units",
    attachedUnits: "Attached Units",
    radioChannels: "Radio Channels",
    recentIncidents: "Recent Incidents",
    mapTitle: "Los Santos — Live Map",
    callNumber: "Call #",
    time: "Time",
    callerName: "Caller Name",
    phone: "Phone",
    description: "Description",
    mapPing: "Active incident ping",
  },
  officers: {
    title: "Officers Management",
    hours: "Hours",
    specialization: "Specialization",
    searchPlaceholder: "Search officers…",
  },
  reports: {
    title: "Reports & Evidence",
    tabs: {
      overview: "Overview",
      peopleInvolved: "People Involved",
      vehicles: "Vehicles",
      evidence: "Evidence",
      evidenceLocker: "Evidence Locker",
    },
    secured: "Secured",
    quantity: "Qty",
    category: "Category",
    reportId: "Report ID",
    processFine: "Process Fine",
  },
  fineModal: {
    title: "Process Fine",
    fineAmount: "Fine Amount ($)",
    chargesSummary: "Charges Summary",
    total: "Total",
    cancel: "Cancel",
    submit: "Process Fine",
    chargeLabel: "Charge",
    amount: "Amount",
  },
  status: {
    available: "Available",
    busy: "Busy",
    enRoute: "En Route",
    onScene: "On Scene",
    active: "Active",
    cleared: "Cleared",
    served: "Served",
    expired: "Expired",
  },
  common: {
    loading: "Loading…",
    save: "Save",
    close: "Close",
    viewAll: "View all",
  },
} as const;

export type Messages = typeof messages;

/** Resolve dot-notation keys, e.g. t("nav.dashboard") */
export function t(path: string): string {
  const parts = path.split(".");
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  return typeof cur === "string" ? cur : path;
}
