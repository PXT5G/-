"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { messages } from "@/lib/i18n/messages";
import type { SystemSettings } from "@/lib/auth/types";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings));
  }, []);

  const save = async () => {
    if (!settings) return;
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) return <p className="text-mdt-muted">{messages.common.loading}</p>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{messages.admin.systemSettings}</h1>
        <button
          type="button"
          onClick={save}
          className="rounded-lg border border-neon-green/40 bg-neon-green/10 px-4 py-2 text-sm text-neon-green"
        >
          {saved ? messages.common.success : messages.admin.save}
        </button>
      </header>

      <Panel>
        <div className="space-y-4">
          <Toggle
            label={messages.admin.lockdown}
            checked={settings.mdtLockdown}
            onChange={(v) => setSettings({ ...settings, mdtLockdown: v })}
          />
          <Toggle
            label={messages.admin.maintenance}
            checked={settings.maintenanceMode}
            onChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
          />
          <Toggle
            label={messages.admin.requireDuty}
            checked={settings.requireOnDutyForDispatch}
            onChange={(v) => setSettings({ ...settings, requireOnDutyForDispatch: v })}
          />
          <div>
            <label className="mb-1 block text-sm text-mdt-muted">{messages.admin.sessionTimeout}</label>
            <input
              type="number"
              value={settings.sessionTimeoutMinutes}
              onChange={(e) =>
                setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })
              }
              className="w-32 rounded border border-mdt-panel-border bg-slate-950 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-mdt-muted">{messages.admin.maxAttempts}</label>
            <input
              type="number"
              value={settings.maxLoginAttempts}
              onChange={(e) =>
                setSettings({ ...settings, maxLoginAttempts: Number(e.target.value) })
              }
              className="w-32 rounded border border-mdt-panel-border bg-slate-950 px-3 py-2"
            />
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-mdt-panel-border px-4 py-3">
      <span className="text-sm">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
