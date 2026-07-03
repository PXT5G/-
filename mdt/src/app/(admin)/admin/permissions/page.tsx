"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { messages } from "@/lib/i18n/messages";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
} from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/types";

export default function AdminPermissionsPage() {
  const [accounts, setAccounts] = useState<Array<{ id: string; username: string; role: UserRole; permissions: string[] }>>([]);

  useEffect(() => {
    fetch("/api/admin/accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{messages.admin.permissionMatrix}</h1>
      </header>

      <Panel title="الأدوار الافتراضية">
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(ROLE_PERMISSIONS) as UserRole[]).map((role) => (
            <div key={role} className="rounded-lg border border-mdt-panel-border p-4">
              <h3 className="mb-2 font-semibold text-neon-blue">{ROLE_LABELS[role]}</h3>
              <div className="flex flex-wrap gap-1">
                {ROLE_PERMISSIONS[role].map((p) => (
                  <span key={p} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-mdt-muted">
                    {PERMISSION_LABELS[p]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="صلاحيات الحسابات">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs">
            <thead>
              <tr className="border-b border-mdt-panel-border text-mdt-muted">
                <th className="pb-2 pe-3 text-start">الحساب</th>
                {ALL_PERMISSIONS.map((p) => (
                  <th key={p} className="pb-2 px-1 text-center">{PERMISSION_LABELS[p].slice(0, 6)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id} className="border-b border-mdt-panel-border/50">
                  <td className="py-2 pe-3 font-mono">{acc.username}</td>
                  {ALL_PERMISSIONS.map((p) => (
                    <td key={p} className="px-1 py-2 text-center">
                      {acc.permissions.includes(p) ? "✓" : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
