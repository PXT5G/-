import { MapPin } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { messages } from "@/lib/i18n/messages";

export function MapPlaceholder() {
  return (
    <Panel title={messages.dispatch.mapTitle} className="h-full min-h-[480px]">
      <div className="relative h-[420px] overflow-hidden rounded-md border border-mdt-panel-border bg-slate-950">
        {/* Stylized Los Santos map grid placeholder */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(56,189,248,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(56,189,248,0.15) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-transparent to-slate-950/90" />

        {/* Map labels */}
        <div className="absolute left-[18%] top-[22%] text-[10px] uppercase tracking-widest text-mdt-muted/60">
          Vinewood
        </div>
        <div className="absolute left-[42%] top-[48%] text-[10px] uppercase tracking-widest text-mdt-muted/60">
          Downtown LS
        </div>
        <div className="absolute right-[20%] bottom-[28%] text-[10px] uppercase tracking-widest text-mdt-muted/60">
          Port of LS
        </div>

        {/* Incident ping */}
        <div
          className="absolute left-[46%] top-[44%] -translate-x-1/2 -translate-y-1/2"
          role="img"
          aria-label={messages.dispatch.mapPing}
        >
          <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-neon-red/30" />
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-neon-red bg-neon-red/20 mdt-glow-red">
            <MapPin className="h-4 w-4 text-neon-red" />
          </span>
        </div>

        <div className="absolute bottom-3 left-3 rounded border border-mdt-panel-border bg-slate-900/90 px-3 py-2 text-xs">
          <p className="font-mono text-neon-blue">24-07142</p>
          <p className="text-mdt-muted">Legion Square — San Andreas Ave</p>
        </div>
      </div>
      {/* Discord Bot API: WebSocket /dispatch/map — live unit & incident positions */}
    </Panel>
  );
}
