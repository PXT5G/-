"use client";

import { Activity, FileText, Shield, Timer, Users, Package } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { messages } from "@/lib/i18n/messages";
import { analyticsSnapshot } from "@/lib/data/extended-mock";

export default function AdminAnalyticsPage() {
  const s = analyticsSnapshot;

  const stats = [
    { icon: FileText, label: "إجمالي التقارير", value: s.totalReports, color: "text-neon-blue" },
    { icon: Shield, label: "مذكرات نشطة", value: s.activeWarrants, color: "text-neon-red" },
    { icon: Activity, label: "حوادث اليوم", value: s.incidentsToday, color: "text-neon-green" },
    { icon: Users, label: "في الخدمة", value: s.officersOnDuty, color: "text-neon-green" },
    { icon: Timer, label: "متوسط الاستجابة (د)", value: s.avgResponseMin, color: "text-neon-blue" },
    { icon: Package, label: "عناصر الأدلة", value: s.evidenceItems, color: "text-mdt-muted" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{messages.admin.analytics}</h1>
        <p className="text-sm text-mdt-muted">تحليلات مفصلة — مثل FiveM Advanced MDT</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="mdt-panel rounded-xl p-5">
            <Icon className={`mb-2 h-5 w-5 ${color}`} />
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-mdt-muted">{label}</p>
          </div>
        ))}
      </div>

      <Panel title="أداء الأقسام">
        <div className="space-y-3">
          {[
            { dept: "LSPD", reports: 142, response: 3.8 },
            { dept: "BCSO", reports: 58, response: 5.1 },
            { dept: "EMS", reports: 48, response: 2.9 },
          ].map((d) => (
            <div key={d.dept} className="flex items-center gap-4">
              <span className="w-16 font-mono text-sm text-neon-blue">{d.dept}</span>
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-neon-blue/60"
                    style={{ width: `${Math.min(100, d.reports)}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-mdt-muted">{d.reports} تقرير · {d.response}د</span>
            </div>
          ))}
        </div>
        {/* Discord Bot API: GET /analytics — performance statistics */}
      </Panel>
    </div>
  );
}
