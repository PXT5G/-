import type { Permission, UserRole } from "./types";

/** Default permissions per role — admins can override per account */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    "dashboard",
    "citizens",
    "incidents",
    "reports",
    "fto_reports",
    "roster",
    "vehicles",
    "criminal_code",
    "warrants",
    "officers",
    "cameras",
    "bodycam",
    "dispatch",
    "weapons",
    "admin_panel",
  ],
  admin: [
    "dashboard",
    "citizens",
    "incidents",
    "reports",
    "fto_reports",
    "roster",
    "vehicles",
    "criminal_code",
    "warrants",
    "officers",
    "cameras",
    "bodycam",
    "dispatch",
    "weapons",
    "admin_panel",
  ],
  supervisor: [
    "dashboard",
    "citizens",
    "incidents",
    "reports",
    "roster",
    "vehicles",
    "warrants",
    "officers",
    "dispatch",
    "bodycam",
  ],
  officer: [
    "dashboard",
    "citizens",
    "incidents",
    "reports",
    "vehicles",
    "warrants",
    "dispatch",
    "bodycam",
  ],
};

export const ALL_PERMISSIONS: Permission[] = ROLE_PERMISSIONS.super_admin;

export function isAdminRole(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function hasPermission(
  permissions: Permission[],
  required: Permission,
  role: UserRole,
): boolean {
  if (role === "super_admin") return true;
  return permissions.includes(required);
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  dashboard: "لوحة التحكم",
  citizens: "المواطنون",
  incidents: "الحوادث",
  reports: "التقارير",
  fto_reports: "تقارير FTO",
  roster: "الكشف",
  vehicles: "المركبات",
  criminal_code: "القانون الجنائي",
  warrants: "مذكرات التوقيف",
  officers: "إدارة الضباط",
  cameras: "كاميرات المراقبة",
  bodycam: "كاميرا الجسم",
  dispatch: "الإرسال",
  weapons: "الأسلحة",
  admin_panel: "لوحة التحكم الإدارية",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "مدير النظام",
  admin: "مشرف",
  supervisor: "رقيب",
  officer: "ضابط",
};
