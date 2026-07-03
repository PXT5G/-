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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { messages, t } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils/cn";
import { UserProfile } from "./UserProfile";

interface NavEntry {
  key: keyof typeof messages.nav;
  href: string;
  icon: LucideIcon;
}

const navItems: NavEntry[] = [
  { key: "dashboard", href: "/", icon: LayoutDashboard },
  { key: "citizens", href: "/citizens", icon: Users },
  { key: "incidents", href: "/incidents", icon: Siren },
  { key: "reports", href: "/reports", icon: FileText },
  { key: "ftoReports", href: "/fto-reports", icon: ScrollText },
  { key: "roster", href: "/roster", icon: Users },
  { key: "vehicles", href: "/vehicles", icon: Car },
  { key: "criminalCode", href: "/criminal-code", icon: BookOpen },
  { key: "warrant", href: "/warrants", icon: Gavel },
  { key: "officersManagement", href: "/officers", icon: UserCog },
  { key: "securityCameras", href: "/cameras", icon: Camera },
  { key: "bodycam", href: "/bodycam", icon: Video },
  { key: "dispatch", href: "/dispatch", icon: Radio },
  { key: "weapons", href: "/weapons", icon: Crosshair },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-e border-mdt-panel-border bg-slate-950/80">
      <div className="border-b border-mdt-panel-border px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neon-blue/30 bg-neon-blue/10 mdt-glow-blue">
            <Shield className="h-5 w-5 text-neon-blue" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-mdt-foreground">
              {messages.app.title}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-mdt-muted">
              {messages.app.subtitle}
            </p>
          </div>
        </div>
      </div>

      <nav className="mdt-scroll flex-1 overflow-y-auto px-2 py-3" aria-label="Main navigation">
        <ul className="space-y-0.5">
          {navItems.map(({ key, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <li key={key}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "border border-neon-blue/30 bg-neon-blue/10 text-neon-blue mdt-glow-blue"
                      : "text-mdt-muted hover:bg-slate-800/60 hover:text-mdt-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="sidebar-nav-icon h-4 w-4 shrink-0" aria-hidden />
                  <span>{t(`nav.${key}`)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <UserProfile />
    </aside>
  );
}
