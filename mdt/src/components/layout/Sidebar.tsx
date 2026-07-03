"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Camera,
  Car,
  FileText,
  Gavel,
  LayoutDashboard,
  Radio,
  ScrollText,
  Shield,
  Siren,
  UserCog,
  Users,
  Video,
  Crosshair,
  Scale,
  Settings,
  ClipboardList,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { messages, t } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils/cn";
import { UserProfile } from "./UserProfile";
import { useAuth } from "@/context/AuthContext";
import { useMdt } from "@/context/MdtContext";
import { JOBS } from "@/lib/config/jobs";
import type { Permission } from "@/lib/auth/types";

interface NavEntry {
  key: keyof typeof messages.nav;
  href: string;
  icon: LucideIcon;
  perm: Permission;
}

const navItems: NavEntry[] = [
  { key: "dashboard", href: "/", icon: LayoutDashboard, perm: "dashboard" },
  { key: "dojDossier", href: "/doj", icon: Scale, perm: "doj_dossier" },
  { key: "citizens", href: "/citizens", icon: Users, perm: "citizens" },
  { key: "incidents", href: "/incidents", icon: Siren, perm: "incidents" },
  { key: "reports", href: "/reports", icon: FileText, perm: "reports" },
  { key: "ftoReports", href: "/fto-reports", icon: ScrollText, perm: "fto_reports" },
  { key: "roster", href: "/roster", icon: ClipboardList, perm: "roster" },
  { key: "vehicles", href: "/vehicles", icon: Car, perm: "vehicles" },
  { key: "criminalCode", href: "/criminal-code", icon: BookOpen, perm: "criminal_code" },
  { key: "warrant", href: "/warrants", icon: Gavel, perm: "warrants" },
  { key: "officersManagement", href: "/officers", icon: UserCog, perm: "officers" },
  { key: "securityCameras", href: "/cameras", icon: Camera, perm: "cameras" },
  { key: "bodycam", href: "/bodycam", icon: Video, perm: "bodycam" },
  { key: "dispatch", href: "/dispatch", icon: Radio, perm: "dispatch" },
  { key: "weapons", href: "/weapons", icon: Crosshair, perm: "weapons" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { can, isAdmin } = useAuth();
  const { job } = useMdt();
  const jobConfig = JOBS[job];
  const visibleNav = navItems.filter((item) => can(item.perm));

  const accentActive =
    jobConfig.accent === "amber"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-300 accent-glow"
      : jobConfig.accent === "green"
        ? "border-neon-green/30 bg-neon-green/10 text-neon-green mdt-glow-green"
        : jobConfig.accent === "red"
          ? "border-neon-red/30 bg-neon-red/10 text-neon-red mdt-glow-red"
          : "border-neon-blue/30 bg-neon-blue/10 text-neon-blue mdt-glow-blue";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 start-0 z-50 flex h-full w-64 shrink-0 flex-col border-e border-mdt-panel-border bg-slate-950/95 backdrop-blur-md transition-transform duration-300 md:static md:translate-x-0 md:bg-slate-950/80",
        mobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full md:translate-x-0",
      )}
    >
      <div className="border-b border-mdt-panel-border px-4 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg accent-border accent-bg accent-glow")}>
              <Shield className="h-5 w-5 accent-text" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-mdt-foreground">
                {messages.app.title}
              </p>
              <p className="text-[10px] uppercase tracking-widest accent-text">
                {jobConfig.labelAr}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-md p-1 text-mdt-muted md:hidden"
            aria-label={messages.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <nav className="mdt-scroll flex-1 overflow-y-auto px-2 py-3" aria-label="Main navigation">
        <ul className="space-y-0.5">
          {visibleNav.map(({ key, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <li key={key}>
                <Link
                  href={href}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                    active ? accentActive : "text-mdt-muted hover:bg-slate-800/60 hover:text-mdt-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="sidebar-nav-icon h-4 w-4 shrink-0" aria-hidden />
                  <span>{t(`nav.${key}`)}</span>
                </Link>
              </li>
            );
          })}
          {isAdmin && (
            <li>
              <Link
                href="/admin"
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  pathname.startsWith("/admin")
                    ? "border border-neon-red/30 bg-neon-red/10 text-neon-red"
                    : "text-mdt-muted hover:bg-slate-800/60 hover:text-mdt-foreground",
                )}
              >
                <Settings className="h-4 w-4" />
                <span>{messages.nav.admin}</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <UserProfile />
    </aside>
  );
}
