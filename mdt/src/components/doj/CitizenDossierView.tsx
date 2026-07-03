"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Car,
  FileText,
  Home,
  History,
  User,
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CitizenAvatar } from "./CitizenAvatar";
import { messages } from "@/lib/i18n/messages";
import type { CitizenDossier } from "@/types/doj-dossier";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/lib/utils/cn";

type Tab = "overview" | "vehicles" | "properties" | "finances" | "records";

const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "overview", label: messages.doj.tabs.overview, icon: User },
  { key: "vehicles", label: messages.doj.tabs.vehicles, icon: Car },
  { key: "properties", label: messages.doj.tabs.properties, icon: Home },
  { key: "finances", label: messages.doj.tabs.finances, icon: Banknote },
  { key: "records", label: messages.doj.tabs.records, icon: History },
];

export function CitizenDossierView({ dossier }: { dossier: CitizenDossier }) {
  const [tab, setTab] = useState<Tab>("overview");
  const { toast } = useNotifications();

  const exportDossier = () => {
    toast({
      title: "تصدير الملف",
      message: `جاري إرسال ملف ${dossier.fullName} إلى Discord DM`,
      variant: "info",
    });
    // Discord Bot API: POST /doj/export/{id}
  };

  return (
    <div className="page-enter space-y-6">
      <Link
        href="/doj"
        className="inline-flex items-center gap-2 text-sm text-amber-300 hover:underline"
      >
        <ArrowRight className="h-4 w-4" />
        {messages.doj.backToSearch}
      </Link>

      <div className="mdt-panel overflow-hidden rounded-2xl">
        <div className="relative bg-gradient-to-l from-amber-500/10 via-transparent to-transparent p-6">
          <div className="flex flex-wrap items-start gap-6">
            <CitizenAvatar seed={dossier.photoSeed} name={dossier.fullName} size="xl" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{dossier.fullName}</h1>
              <p className="mt-1 font-mono text-sm text-amber-300">{dossier.nationalId}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-mdt-muted">
                <span>DOB: {dossier.dob}</span>
                <span>{dossier.phone}</span>
                <span>{dossier.address}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {dossier.flags.map((f) => (
                  <StatusBadge key={f} label={f} variant="red" />
                ))}
                {dossier.licenses.map((l) => (
                  <StatusBadge key={l} label={l} variant="green" />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={exportDossier}
              className="rounded-lg border border-amber-400/40 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/10"
            >
              {messages.doj.exportDossier}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 border-t border-mdt-panel-border p-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all",
                tab === key
                  ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                  : "text-mdt-muted hover:bg-slate-800/50",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="الرصيد البنكي" value={`$${dossier.bankBalance.toLocaleString()}`} />
          <StatCard label="غرامات مستحقة" value={`$${dossier.finesOwed.toLocaleString()}`} accent="red" />
          <StatCard label="المركبات" value={String(dossier.vehicles.length)} />
          <StatCard label="العقارات" value={String(dossier.properties.length)} />
        </div>
      )}

      {tab === "vehicles" && (
        <div className="stagger-children grid gap-4 sm:grid-cols-2">
          {dossier.vehicles.map((v) => (
            <Panel key={v.id}>
              <div className="flex gap-4">
                <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-slate-900">
                  <Car className="h-8 w-8 text-mdt-muted/40" />
                </div>
                <div>
                  <p className="font-mono text-lg font-bold text-neon-blue">{v.plate}</p>
                  <p className="font-semibold">{v.model} — {v.color}</p>
                  <p className="text-xs text-mdt-muted">تسجيل: {v.registeredAt}</p>
                  <StatusBadge
                    label={v.status}
                    variant={v.status === "مسجّل" ? "green" : "red"}
                    className="mt-2"
                  />
                </div>
              </div>
            </Panel>
          ))}
          {dossier.vehicles.length === 0 && (
            <p className="text-mdt-muted">{messages.doj.noData}</p>
          )}
        </div>
      )}

      {tab === "properties" && (
        <div className="stagger-children grid gap-4 sm:grid-cols-2">
          {dossier.properties.map((p) => (
            <Panel key={p.id}>
              <div className="flex gap-4">
                <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-slate-900">
                  <Home className="h-8 w-8 text-mdt-muted/40" />
                </div>
                <div>
                  <p className="font-semibold">{p.label}</p>
                  <p className="text-sm text-mdt-muted">{p.address}</p>
                  <p className="text-xs text-mdt-muted">{p.type} — شراء: {p.purchasedAt}</p>
                  <p className="mt-1 font-mono text-amber-300">${p.value.toLocaleString()}</p>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {tab === "finances" && (
        <Panel title={messages.doj.tabs.finances}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mdt-panel-border text-[10px] uppercase text-mdt-muted">
                <th className="pb-2 text-start">النوع</th>
                <th className="pb-2 text-start">المبلغ</th>
                <th className="pb-2 text-start">التاريخ</th>
                <th className="pb-2 text-start">ملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {dossier.transactions.map((t) => (
                <tr key={t.id} className="border-b border-mdt-panel-border/50">
                  <td className="py-2.5">{t.type}</td>
                  <td className={cn("py-2.5 font-mono", t.amount < 0 ? "text-neon-red" : "text-neon-green")}>
                    {t.amount < 0 ? "" : "+"}${Math.abs(t.amount).toLocaleString()}
                  </td>
                  <td className="py-2.5 text-mdt-muted">{t.date}</td>
                  <td className="py-2.5 text-mdt-muted">{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {tab === "records" && (
        <div className="space-y-3">
          {dossier.records.map((r) => (
            <Panel key={r.id}>
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 text-amber-300" />
                <div>
                  <p className="font-semibold">{r.type}</p>
                  <p className="text-sm text-mdt-muted">{r.description}</p>
                  <p className="mt-1 text-xs text-mdt-muted">
                    {r.date}{r.officer ? ` — ${r.officer}` : ""}
                  </p>
                </div>
              </div>
            </Panel>
          ))}
          {dossier.notes && (
            <Panel title="ملاحظات DOJ">
              <p className="text-sm text-mdt-muted">{dossier.notes}</p>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "red";
}) {
  return (
    <div className="mdt-panel rounded-xl p-4">
      <p className="text-xs text-mdt-muted">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", accent === "red" ? "text-neon-red" : "text-mdt-foreground")}>
        {value}
      </p>
    </div>
  );
}
