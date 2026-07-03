"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, KeyRound } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { AuthAccount, UserRole } from "@/lib/auth/types";

type SafeAccount = Omit<AuthAccount, "passwordHash">;

const EMPTY_FORM = {
  username: "",
  password: "",
  name: "",
  rank: "Officer",
  department: "LSPD",
  callsign: "",
  role: "officer" as UserRole,
  active: true,
};

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<SafeAccount[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SafeAccount | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/accounts");
    const data = await res.json();
    setAccounts(data.accounts ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (acc: SafeAccount) => {
    setEditing(acc);
    setForm({
      username: acc.username,
      password: "",
      name: acc.officer.name,
      rank: acc.officer.rank,
      department: acc.officer.department,
      callsign: acc.officer.callsign,
      role: acc.role,
      active: acc.active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setError("");
    const officer = {
      id: editing?.officer.id ?? `off-${Date.now()}`,
      name: form.name,
      rank: form.rank,
      department: form.department,
      callsign: form.callsign,
      badges: editing?.officer.badges ?? [],
      hours: editing?.officer.hours ?? 0,
    };

    const res = editing
      ? await fetch("/api/admin/accounts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editing.id,
            username: form.username,
            role: form.role,
            active: form.active,
            officer,
            ...(form.password ? { password: form.password } : {}),
          }),
        })
      : await fetch("/api/admin/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username,
            password: form.password,
            role: form.role,
            active: form.active,
            officer,
          }),
        });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error === "USERNAME_EXISTS" ? "اسم المستخدم موجود مسبقاً" : messages.common.error);
      return;
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الحساب؟")) return;
    await fetch(`/api/admin/accounts?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-mdt-foreground">{messages.admin.accounts}</h1>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg border border-neon-green/40 bg-neon-green/10 px-4 py-2 text-sm font-semibold text-neon-green hover:bg-neon-green/20"
        >
          <Plus className="h-4 w-4" />
          {messages.admin.createAccount}
        </button>
      </header>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-mdt-panel-border text-[10px] uppercase tracking-wider text-mdt-muted">
                <th className="pb-2 pe-4 text-start">{messages.admin.username}</th>
                <th className="pb-2 pe-4 text-start">{messages.dashboard.name}</th>
                <th className="pb-2 pe-4 text-start">{messages.admin.role}</th>
                <th className="pb-2 pe-4 text-start">{messages.dashboard.status}</th>
                <th className="pb-2 pe-4 text-start">{messages.admin.lastLogin}</th>
                <th className="pb-2 text-start">{messages.admin.actions}</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id} className="border-b border-mdt-panel-border/50 hover:bg-slate-800/30">
                  <td className="py-3 pe-4 font-mono text-neon-blue">{acc.username}</td>
                  <td className="py-3 pe-4">{acc.officer.name}</td>
                  <td className="py-3 pe-4">{ROLE_LABELS[acc.role]}</td>
                  <td className="py-3 pe-4">
                    <StatusBadge
                      label={acc.active ? messages.admin.active : messages.admin.inactive}
                      variant={acc.active ? "green" : "red"}
                    />
                  </td>
                  <td className="py-3 pe-4 text-xs text-mdt-muted">
                    {acc.lastLogin
                      ? new Date(acc.lastLogin).toLocaleString("ar-SA")
                      : "—"}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(acc)}
                        className="rounded border border-mdt-panel-border p-1.5 text-mdt-muted hover:text-neon-blue"
                        title={messages.admin.editAccount}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(acc.id)}
                        className="rounded border border-mdt-panel-border p-1.5 text-mdt-muted hover:text-neon-red"
                        title={messages.admin.deleteAccount}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="mdt-panel w-full max-w-lg rounded-xl p-6">
            <h2 className="mb-4 text-lg font-bold">
              {editing ? messages.admin.editAccount : messages.admin.createAccount}
            </h2>
            {error && (
              <p className="mb-3 text-sm text-neon-red">{error}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label={messages.admin.username} value={form.username} onChange={(v) => setForm({ ...form, username: v })} />
              <Field
                label={editing ? messages.admin.resetPassword : messages.admin.password}
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                type="password"
                placeholder={editing ? "اتركه فارغاً للإبقاء" : ""}
              />
              <Field label={messages.dashboard.name} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label={messages.dashboard.rank} value={form.rank} onChange={(v) => setForm({ ...form, rank: v })} />
              <Field label={messages.dashboard.department} value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
              <Field label={messages.dashboard.callsign} value={form.callsign} onChange={(v) => setForm({ ...form, callsign: v })} />
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-mdt-muted">{messages.admin.role}</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full rounded border border-mdt-panel-border bg-slate-950 px-3 py-2 text-sm"
                >
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <label className="col-span-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                {messages.admin.active}
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded border border-mdt-panel-border px-4 py-2 text-sm text-mdt-muted">
                {messages.admin.cancel}
              </button>
              <button type="button" onClick={handleSave} className="flex items-center gap-2 rounded border border-neon-green/40 bg-neon-green/10 px-4 py-2 text-sm text-neon-green">
                <KeyRound className="h-4 w-4" />
                {messages.admin.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-mdt-muted">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-mdt-panel-border bg-slate-950 px-3 py-2 text-sm"
      />
    </div>
  );
}
