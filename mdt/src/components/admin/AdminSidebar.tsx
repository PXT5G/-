"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
  KeyRound,
} from "lucide-react";
import { messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/context/AuthContext";

const adminNav = [
  { href: "/admin", label: messages.admin.overview, icon: LayoutDashboard },
  { href: "/admin/accounts", label: messages.admin.accounts, icon: Users },
  { href: "/admin/permissions", label: messages.admin.permissions, icon: KeyRound },
  { href: "/admin/analytics", label: messages.admin.analytics, icon: BarChart3 },
  { href: "/admin/settings", label: messages.admin.settings, icon: Settings },
  { href: "/admin/logs", label: messages.admin.logs, icon: ClipboardList },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-e border-mdt-panel-border bg-slate-950/90">
      <div className="border-b border-mdt-panel-border px-4 py-5">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-neon-red" />
          <div>
            <p className="text-sm font-bold text-mdt-foreground">{messages.admin.title}</p>
            <p className="text-[10px] text-mdt-muted">{user?.officer.name}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {adminNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                active
                  ? "border border-neon-red/30 bg-neon-red/10 text-neon-red"
                  : "text-mdt-muted hover:bg-slate-800/60 hover:text-mdt-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-mdt-panel-border p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md border border-neon-blue/30 px-3 py-2 text-xs text-neon-blue hover:bg-neon-blue/10"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          {messages.admin.backToMdt}
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="w-full rounded-md border border-mdt-panel-border px-3 py-2 text-xs text-mdt-muted hover:bg-slate-800"
        >
          {messages.auth.logout}
        </button>
      </div>
    </aside>
  );
}
