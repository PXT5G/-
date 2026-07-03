"use client";

import { useEffect, useState } from "react";
import { Activity, Shield, Users, AlertTriangle } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";

interface Stats {
  accounts: number;
  activeAccounts: number;
  auditCount: number;
  lockdown: boolean;
  maintenance: boolean;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/accounts").then((r) => r.json()),
      fetch("/api/admin/audit?limit=5").then((r) => r.json()),
      fetch("/api/admin/settings").then((r) => r.json()),
    ]).then(([acc, audit, settings]) => {
      const accounts = acc.accounts ?? [];
      setStats({
        accounts: accounts.length,
        activeAccounts: accounts.filter((a: { active: boolean }) => a.active).length,
        auditCount: audit.entries?.length ?? 0,
        lockdown: settings.settings?.mdtLockdown ?? false,
        maintenance: settings.settings?.maintenanceMode ?? false,
      });
    });
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-mdt-foreground">{messages.admin.overview}</h1>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label={messages.admin.totalOfficers}
          value={stats?.accounts ?? "—"}
          variant="blue"
        />
        <StatCard
          icon={Activity}
          label="حسابات نشطة"
          value={stats?.activeAccounts ?? "—"}
          variant="green"
        />
        <StatCard
          icon={Shield}
          label={messages.admin.auditLog}
          value={stats?.auditCount ?? "—"}
          variant="blue"
        />
        <StatCard
          icon={AlertTriangle}
          label={messages.admin.lockdown}
          value={stats?.lockdown ? "مفعّل" : "معطّل"}
          variant={stats?.lockdown ? "red" : "green"}
        />
      </div>

      <Panel title="حالة النظام">
        <div className="flex flex-wrap gap-3">
          <StatusBadge
            label={stats?.maintenance ? "وضع الصيانة: مفعّل" : "وضع الصيانة: معطّل"}
            variant={stats?.maintenance ? "red" : "green"}
          />
          <StatusBadge
            label={stats?.lockdown ? "إغلاق MDT: مفعّل" : "إغلاق MDT: معطّل"}
            variant={stats?.lockdown ? "red" : "green"}
          />
        </div>
      </Panel>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  variant,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  variant: "green" | "red" | "blue";
}) {
  const colors = {
    green: "border-neon-green/30 text-neon-green",
    red: "border-neon-red/30 text-neon-red",
    blue: "border-neon-blue/30 text-neon-blue",
  };
  return (
    <div className={`mdt-panel rounded-xl p-5 ${colors[variant]}`}>
      <Icon className="mb-3 h-5 w-5" />
      <p className="text-2xl font-bold text-mdt-foreground">{value}</p>
      <p className="mt-1 text-xs text-mdt-muted">{label}</p>
    </div>
  );
}
