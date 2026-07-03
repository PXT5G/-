"use client";

import Link from "next/link";
import { Scale, Users } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { messages } from "@/lib/i18n/messages";
import { citizenDossiers } from "@/lib/data/doj-dossiers";
import { CitizenAvatar } from "@/components/doj/CitizenAvatar";

export default function CitizensPage() {
  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{messages.nav.citizens}</h1>
        <Link
          href="/doj"
          className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-300 transition-all hover:bg-amber-400/20"
        >
          <Scale className="h-4 w-4" />
          {messages.doj.title}
        </Link>
      </header>

      <Panel>
        <p className="mb-4 flex items-center gap-2 text-sm text-mdt-muted">
          <Users className="h-4 w-4" />
          للبحث الشامل (عقارات، مركبات، أموال، صور) استخدم نظام DOJ
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {citizenDossiers.slice(0, 4).map((d) => (
            <Link
              key={d.id}
              href={`/doj/${d.id}`}
              className="card-hover flex items-center gap-3 rounded-lg border border-mdt-panel-border p-3 hover:border-amber-400/30"
            >
              <CitizenAvatar seed={d.photoSeed} name={d.fullName} />
              <div>
                <p className="font-semibold">{d.fullName}</p>
                <p className="text-xs text-mdt-muted">{d.nationalId}</p>
              </div>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
