"use client";

import { Play, Radio, Video } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { messages } from "@/lib/i18n/messages";
import { bodycamRecordings } from "@/lib/data/extended-mock";
import { useAuth } from "@/context/AuthContext";

export default function BodycamPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{messages.bodycam.title}</h1>
      </header>

      <Panel title={messages.bodycam.liveFeed}>
        <div className="relative flex h-64 items-center justify-center rounded-lg border border-neon-green/30 bg-slate-950">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-neon-green/40 bg-neon-green/10">
              <Radio className="h-6 w-6 animate-pulse text-neon-green" />
            </div>
            <p className="text-sm font-semibold text-neon-green">{messages.bodycam.liveFeed}</p>
            <p className="mt-1 text-xs text-mdt-muted">
              {user?.officer.name} — {user?.officer.callsign}
            </p>
          </div>
          <span className="absolute start-3 top-3 rounded bg-neon-red/20 px-2 py-0.5 text-[10px] font-bold text-neon-red">
            LIVE
          </span>
        </div>
        {/* Discord Bot API: WebSocket /bodycam/live — real-time feed relay from FiveM */}
      </Panel>

      <Panel title={messages.bodycam.archive}>
        <ul className="space-y-2">
          {bodycamRecordings.map((rec) => (
            <li
              key={rec.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-mdt-panel-border bg-slate-900/40 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-neon-blue" />
                <div>
                  <p className="text-sm font-medium">
                    {messages.bodycam.officer}: {rec.officerName} ({rec.callsign})
                  </p>
                  <p className="text-xs text-mdt-muted">
                    {new Date(rec.startedAt).toLocaleString("ar-SA")} — {rec.durationMin} {messages.bodycam.duration}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="flex items-center gap-1 rounded border border-neon-blue/30 px-3 py-1.5 text-xs text-neon-blue hover:bg-neon-blue/10"
              >
                <Play className="h-3.5 w-3.5" />
                {messages.bodycam.watch}
              </button>
            </li>
          ))}
        </ul>
        {/* Discord Bot API: GET /bodycam/recordings */}
      </Panel>
    </div>
  );
}
