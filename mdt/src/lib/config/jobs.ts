/** وظائف MDT — مطابق لنظام FiveM Advanced MDT (Police, EMS, DOJ, Fire) */
export type JobType = "police" | "ems" | "doj" | "fire";

export interface JobConfig {
  id: JobType;
  labelAr: string;
  labelEn: string;
  accent: "blue" | "green" | "red" | "amber";
  departments: string[];
}

export const JOBS: Record<JobType, JobConfig> = {
  police: {
    id: "police",
    labelAr: "الشرطة",
    labelEn: "Police",
    accent: "blue",
    departments: ["LSPD", "BCSO", "SAHP", "SASP"],
  },
  ems: {
    id: "ems",
    labelAr: "الإسعاف",
    labelEn: "EMS",
    accent: "green",
    departments: ["EMS", "Pillbox", "Sandy EMS"],
  },
  doj: {
    id: "doj",
    labelAr: "القضاء",
    labelEn: "DOJ",
    accent: "amber",
    departments: ["DOJ", "District Court"],
  },
  fire: {
    id: "fire",
    labelAr: "الإطفاء",
    labelEn: "Fire",
    accent: "red",
    departments: ["LSFD", "Fire Dept"],
  },
};

export function departmentToJob(dept: string): JobType {
  const d = dept.toUpperCase();
  if (JOBS.ems.departments.some((x) => d.includes(x.toUpperCase()))) return "ems";
  if (JOBS.doj.departments.some((x) => d.includes(x.toUpperCase()))) return "doj";
  if (JOBS.fire.departments.some((x) => d.includes("FIRE") || d.includes("LSFD"))) return "fire";
  return "police";
}
