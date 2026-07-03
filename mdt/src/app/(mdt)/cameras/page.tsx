"use client";

import { Camera, Circle } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { cameraFeeds } from "@/lib/data/extended-mock";

function statusVariant(s: string): "green" | "red" | "blue" {
  if (s === "online") return "green";
  if (s === "recording") return "blue";
  return "red";
}

function statusLabel(s: string): string {
  if (s === "online") return messages.cameras.online;
  if (s === "recording") return messages.cameras.recording;
  return messages.cameras.offline;
}

export default function CamerasPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{messages.cameras.title}</h1>
        <p className="text-sm text-mdt-muted">{messages.cameras.live}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cameraFeeds.map((cam) => (
          <article key={cam.id} className="mdt-panel overflow-hidden rounded-xl">
            <div className="relative flex h-40 items-center justify-center bg-slate-950">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: "linear-gradient(rgba(56,189,248,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.2) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              <Camera className="h-10 w-10 text-mdt-muted/40" />
              {cam.status === "recording" && (
                <span className="absolute end-3 top-3 flex items-center gap-1 rounded bg-neon-red/20 px-2 py-0.5 text-[10px] text-neon-red">
                  <Circle className="h-2 w-2 fill-neon-red animate-pulse" />
                  REC
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{cam.name}</h3>
                <StatusBadge label={statusLabel(cam.status)} variant={statusVariant(cam.status)} />
              </div>
              <p className="text-xs text-mdt-muted">{cam.location}</p>
              {cam.lastMotion && (
                <p className="mt-2 text-[10px] text-mdt-muted">
                  {messages.cameras.lastMotion}: {new Date(cam.lastMotion).toLocaleString("ar-SA")}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
      {/* Discord Bot API: GET /cctv/feeds — stream URLs from game server relay */}
    </div>
  );
}
